module GtkEnhancer = CCMap.Make(String)


module MF = struct
  type t = Literal of { value: string } |  Marker of { value: string; is_open: bool}
  type formatted = (string * string list)
  type fmt_context = {
    sym: string;
    parent: fmt_context option;
    nodes: formatted list
  }

  let ctx ?(parent=None) sym = { sym; parent; nodes=[]}

  let resolve_msg _locale _msg _data =
    (* fake implementation, for simplicity sake *)
    let nodes = [
      Literal { value="Click "};
      Marker { value="a"; is_open=true };
      Literal { value="here"};
      Marker { value="a"; is_open=false };
      Literal { value=" to continue"};
    ] in
    nodes

  let fmt locale msg data ?(enhancer_map=GtkEnhancer.empty) (buffer:GText.buffer) =
    resolve_msg locale msg data
    |> List.fold_left (fun acc it ->
      match it with
      | Literal t -> { acc with nodes = List.cons (t.value, []) acc.nodes }
      | Marker t ->
        match  GtkEnhancer.get t.value enhancer_map with
        (* for simplicity, assume perfect balance an no nesting *)
        | Some enhance -> (match t.is_open with
          | true -> ctx ~parent:(Some acc) t.value
          | false ->
            let parent = CCOption.get_exn_or "missing parent" acc.parent in
            { parent with nodes = List.append (enhance acc.nodes) parent.nodes }
          )
        | None -> acc
    ) (ctx "default")
  |> fun ctx -> ctx.nodes
  |> List.rev
  |> fun enhanced_texts ->
    let iter = buffer#get_iter_at_char 0 in
    List.iter (fun (text, tag_names) ->
      buffer#insert ~iter ~tag_names text
    ) enhanced_texts
end

open MF


let fmt_link children: formatted list =
  let fn (text, tags) = (text, List.cons "link" tags) in
  List.map fn children

let enhancer_map = GtkEnhancer.of_list [("a", fmt_link)]
let fmt_gtext = fmt ~enhancer_map "en" "{Click {@a}here{/@a} to continue}" None

let main () =
  print_endline @@ GMain.init ();
  let w = GWindow.window ~border_width:2 () in
  let view = GText.view () in
  let buffer = view#buffer in
  buffer#create_tag ~name:"link" [`FOREGROUND "blue"] |> ignore;
  fmt_gtext buffer |> ignore;
  w#misc#realize ();
  w#add @@ view#coerce;
  ignore @@ w#show ();
  ignore @@ w#connect#destroy ~callback:GMain.quit;
  GMain.main ()

let () = main ()
