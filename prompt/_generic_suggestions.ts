import type { KeyEvent } from "../keycode/key_event.ts";
import {
  GenericInput,
  GenericInputKeys,
  GenericInputPromptOptions,
  GenericInputPromptSettings,
} from "./_generic_input.ts";
import { blue, bold, dim, stripColor, underline } from "./deps.ts";
import { Figures } from "./figures.ts";

/** Input keys options. */
export interface GenericSuggestionsKeys extends GenericInputKeys {
  complete?: string[];
  next?: string[];
  previous?: string[];
}

/** Generic input prompt options. */
export interface GenericSuggestionsOptions<T, V>
  extends GenericInputPromptOptions<T, V> {
  keys?: GenericSuggestionsKeys;
  suggestions?: Array<string | number>;
  list?: boolean;
  info?: boolean;
  listPointer?: string;
  maxRows?: number;
}

/** Generic input prompt settings. */
export interface GenericSuggestionsSettings<T, V>
  extends GenericInputPromptSettings<T, V> {
  keys?: GenericSuggestionsKeys;
  suggestions?: Array<string | number>;
  list?: boolean;
  info?: boolean;
  listPointer: string;
  maxRows: number;
}

/** Generic input prompt representation. */
export abstract class GenericSuggestions<
  T,
  V,
  S extends GenericSuggestionsSettings<T, V>,
> extends GenericInput<T, V, S> {
  protected suggestionsIndex = -1;
  protected suggestionsOffset = 0;
  protected suggestions: Array<string | number> = [];

  /**
   * Prompt constructor.
   * @param settings Prompt settings.
   */
  protected constructor(settings: S) {
    super({
      ...settings,
      keys: {
        complete: ["tab"],
        next: ["up"],
        previous: ["down"],
        ...(settings.keys ?? {}),
      },
    });
    if (this.settings.suggestions) {
      this.settings.suggestions = this.settings.suggestions.slice();
    }
  }

  protected render(): Promise<void> {
    this.match();
    return super.render();
  }

  protected match(): void {
    if (!this.settings.suggestions?.length) {
      return;
    }
    this.suggestions = this.settings.suggestions.filter(
      (value: string | number) =>
        stripColor(value.toString()).toLowerCase().startsWith(
          this.getCurrentInputValue().toLowerCase(),
        ),
    );
    this.suggestionsIndex = Math.max(
      this.getCurrentInputValue().trim().length === 0 ? -1 : 0,
      Math.min(this.suggestions.length - 1, this.suggestionsIndex),
    );
    this.suggestionsOffset = Math.max(
      0,
      Math.min(
        this.suggestions.length - this.getListHeight(),
        this.suggestionsOffset,
      ),
    );
  }

  protected input(): string {
    return super.input() + dim(this.getSuggestion());
  }

  protected getSuggestion(): string {
    return this.suggestions[this.suggestionsIndex]?.toString()
      .substr(
        this.getCurrentInputValue().length,
      ) ?? "";
  }

  protected body(): string | Promise<string> {
    return this.getList() + this.getInfo();
  }

  protected getInfo(): string {
    if (!this.settings.info) {
      return "";
    }
    const selected: number = this.suggestionsIndex + 1;
    const matched: number = this.suggestions.length;
    const actions: Array<[string, Array<string>]> = [];

    if (this.settings.suggestions?.length) {
      if (this.settings.list) {
        actions.push(
          ["Next", [Figures.ARROW_DOWN]],
          ["Previous", [Figures.ARROW_UP]],
          ["Next Page", [Figures.PAGE_DOWN]],
          ["Previous Page", [Figures.PAGE_UP]],
        );
      } else {
        actions.push(
          ["Next", [Figures.ARROW_UP]],
          ["Previous", [Figures.ARROW_DOWN]],
        );
      }
      actions.push(
        ["Complete", [Figures.TAB_RIGHT, dim(" or"), Figures.ARROW_RIGHT]],
      );
    }
    actions.push(
      ["Submit", [Figures.ENTER]],
    );

    let info = this.settings.indent;
    if (this.settings.suggestions?.length) {
      info += (blue(Figures.INFO) + bold(` ${selected}/${matched} `));
    }
    info += actions
      .map((cur) => `${cur[0]}: ${bold(cur[1].join(" "))}`)
      .join(", ");

    return info;
  }

  protected getList(): string {
    if (!this.settings.suggestions?.length || !this.settings.list) {
      return "";
    }
    const list: Array<string> = [];
    const height: number = this.getListHeight();
    for (
      let i = this.suggestionsOffset;
      i < this.suggestionsOffset + height;
      i++
    ) {
      list.push(
        this.getListItem(
          this.suggestions[i],
          this.suggestionsIndex === i,
        ),
      );
    }
    if (list.length && this.settings.info) {
      list.push("");
    }
    return list.join("\n");
  }

  /**
   * Render option.
   * @param value        Option.
   * @param isSelected  Set to true if option is selected.
   */
  protected getListItem(
    value: string | number,
    isSelected?: boolean,
  ): string {
    let line = this.settings.indent ?? "";
    line += isSelected ? `${this.settings.listPointer} ` : "  ";
    if (isSelected) {
      line += underline(this.highlight(value));
    } else {
      line += this.highlight(value);
    }
    return line;
  }

  /** Get suggestions row height. */
  protected getListHeight(
    suggestions: Array<string | number> = this.suggestions,
  ): number {
    return Math.min(
      suggestions.length,
      this.settings.maxRows || suggestions.length,
    );
  }

  /**
   * Handle user input event.
   * @param event Key event.
   */
  protected async handleEvent(event: KeyEvent): Promise<void> {
    switch (true) {
      case this.isKey(this.settings.keys, "next", event):
        if (this.settings.list) {
          this.selectPreviousSuggestion();
        } else {
          this.selectNextSuggestion();
        }
        break;
      case this.isKey(this.settings.keys, "previous", event):
        if (this.settings.list) {
          this.selectNextSuggestion();
        } else {
          this.selectPreviousSuggestion();
        }
        break;
      case this.isKey(this.settings.keys, "complete", event):
        this.complete();
        break;
      case this.isKey(this.settings.keys, "moveCursorRight", event):
        if (this.inputIndex < this.inputValue.length) {
          this.moveCursorRight();
        } else {
          this.complete();
        }
        break;
      default:
        await super.handleEvent(event);
    }
  }

  /** Delete char right. */
  protected deleteCharRight(): void {
    if (this.inputIndex < this.inputValue.length) {
      super.deleteCharRight();
      if (!this.getCurrentInputValue().length) {
        this.suggestionsIndex = -1;
        this.suggestionsOffset = 0;
      }
    }
  }

  protected complete(): void {
    if (this.suggestions.length && this.suggestions[this.suggestionsIndex]) {
      this.inputValue = this.suggestions[this.suggestionsIndex].toString();
      this.inputIndex = this.inputValue.length;
      this.suggestionsIndex = 0;
      this.suggestionsOffset = 0;
    }
  }

  /** Select previous suggestion. */
  protected selectPreviousSuggestion(): void {
    if (this.suggestions?.length) {
      if (this.suggestionsIndex > -1) {
        this.suggestionsIndex--;
        if (this.suggestionsIndex < this.suggestionsOffset) {
          this.suggestionsOffset--;
        }
      }
    }
  }

  /** Select next suggestion. */
  protected selectNextSuggestion(): void {
    if (this.suggestions?.length) {
      if (this.suggestionsIndex < this.suggestions.length - 1) {
        this.suggestionsIndex++;
        if (
          this.suggestionsIndex >=
            this.suggestionsOffset + this.getListHeight()
        ) {
          this.suggestionsOffset++;
        }
      }
    }
  }
}
