import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchField } from "./search-field";

test("renders a labelled search input and submit action", () => {
  const markup = renderToStaticMarkup(
    createElement(SearchField, {
      defaultValue: "Bundesliga",
      inputId: "competition-query",
      label: "Wettbewerbe durchsuchen",
      name: "q",
      placeholder: "Wettbewerb oder Region",
    }),
  );

  assert.match(
    markup,
    /<label id="competition-query-label" for="competition-query" class="sr-only">Wettbewerbe durchsuchen<\/label>/,
  );
  assert.match(markup, /id="competition-query"/);
  assert.match(markup, /type="search"/);
  assert.match(markup, /name="q"/);
  assert.match(markup, /value="Bundesliga"/);
  assert.match(
    markup,
    /<button type="submit" class="button-primary search-field__submit">Suchen<\/button>/,
  );
});

test("only renders the clear action when it is available", () => {
  const hiddenMarkup = renderToStaticMarkup(
    createElement(SearchField, {
      inputId: "global-query",
      label: "Fußball durchsuchen",
      name: "q",
      onClear: () => undefined,
      showClear: false,
    }),
  );

  assert.doesNotMatch(hiddenMarkup, /aria-label="Suchanfrage löschen"/);

  const visibleMarkup = renderToStaticMarkup(
    createElement(SearchField, {
      inputId: "global-query",
      label: "Fußball durchsuchen",
      name: "q",
      onClear: () => undefined,
      showClear: true,
    }),
  );

  assert.match(visibleMarkup, /type="button"/);
  assert.match(visibleMarkup, /aria-label="Suchanfrage löschen"/);
});
