import { MessageFormat } from "messageformat";
import { applyRuntimeMarkerEnhancements, lit } from "../common/mod.mjs";

const htmlBinding /* MessageFormatV2Binding */ = {
  fmt: (locale, msg, data, options) => {
    const mf = new MessageFormat(msg, locale).resolveMessage(data);
    mf.value = applyRuntimeMarkerEnhancements(mf.value, options);
    return mf.toString();
  },
};

// my-html-js-app
const url = "https://example.com";
const html = htmlBinding.fmt("en", "{Click {@a}here{/@a} to continue}", null, {
  a: (children) => [`<a href="${url}">`, ...children, `</a>`],
});
console.log(html); // Click <a href="https://example.com">here</a>
