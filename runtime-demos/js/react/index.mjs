import { MessageFormat, MessageValue } from "messageformat";
import { applyRuntimeMarkerEnhancements, lit } from "../common/mod.mjs";
import * as React from "react";
import ReactDom from "react-dom/server";

const { createElement, Fragment } = React;

const reactBindings /* MessageFormatV2Binding */ = {
  fmt: (locale, msg, data, options) => {
    const mf = new MessageFormat(msg, locale).resolveMessage(data);
    const children = applyRuntimeMarkerEnhancements(mf.value, options);
    return createElement(
      Fragment,
      null,
      children.map((c) => (c instanceof MessageValue ? c.toString() : c))
    );
  },
};

// my-react-app
const url = "https://example.com";
const MyReactComponent = reactBindings.fmt(
  "en",
  "{Click {@a}here{/@a} to continue}",
  null,
  {
    a: (children) =>
      createElement(
        "a",
        { href: url },
        children.map((c) => (c instanceof MessageValue ? c.toString() : c))
      ),
  }
);
console.log(ReactDom.renderToString(MyReactComponent));
