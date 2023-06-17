import * as mod from "messageformat";

const { MessageFormat } = mod;

export const lit = (text) => new mod.MessageLiteral(text);

export const getTag = (value) => {
  if (value.type === "fallback") {
    if (value.source.startsWith("@")) {
      return { tag: value.source.replace(/^@/, ""), open: true };
    }
    if (value.source.startsWith("/@")) {
      return { tag: value.source.replace(/^\/@/, ""), open: false };
    }
  }
  return null;
};

export const frame = (tag, parent) => ({
  parent,
  tag,
  nodes: [],
  type: "_ctx_",
});

export function applyRuntimeMarkerEnhancements(nodes, options) {
  const defaultTag = Symbol("default");
  const result = nodes.reduce((acc, curr) => {
    const tag = getTag(curr);
    if (tag) {
      if (tag.open) {
        const nextCtx = frame(tag.tag, acc);
        acc.nodes.push(nextCtx);
        return nextCtx;
      } else {
        const currentOpenTag = acc.tag;
        const closingTag = tag.tag;
        if (currentOpenTag !== closingTag) {
          throw new Error(
            `unbalanced tags: got ${closingTag}, expected ${parentOpenTag}`
          );
        }
        const spanValues = acc.parent.nodes.pop().nodes;
        const enhancer = options[tag.tag];
        const enhancedValues = enhancer ? enhancer(spanValues) : spanValues;
        acc.parent.nodes.push(
          ...(Array.isArray(enhancedValues) ? enhancedValues : [enhancedValues])
        );
        return acc.parent;
      }
    } else {
      acc.nodes.push(curr);
    }
    return acc;
  }, frame(defaultTag, null));
  return result.nodes;
}
