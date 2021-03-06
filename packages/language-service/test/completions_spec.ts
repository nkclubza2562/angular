/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {createLanguageService} from '../src/language_service';
import {CompletionKind} from '../src/types';
import {TypeScriptServiceHost} from '../src/typescript_host';

import {MockTypescriptHost} from './test_utils';

const APP_COMPONENT = '/app/app.component.ts';
const PARSING_CASES = '/app/parsing-cases.ts';
const TEST_TEMPLATE = '/app/test.ng';
const EXPRESSION_CASES = '/app/expression-cases.ts';

describe('completions', () => {
  const mockHost = new MockTypescriptHost(['/app/main.ts']);
  const tsLS = ts.createLanguageService(mockHost);
  const ngHost = new TypeScriptServiceHost(mockHost, tsLS);
  const ngLS = createLanguageService(ngHost);

  beforeEach(() => { mockHost.reset(); });

  it('should be able to get entity completions', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'entity-amp');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.ENTITY, ['&amp;', '&gt;', '&lt;', '&iota;']);
  });

  it('should be able to return html elements', () => {
    const locations = ['empty', 'start-tag-h1', 'h1-content', 'start-tag', 'start-tag-after-h'];
    for (const location of locations) {
      const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, location);
      const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
      expectContain(completions, CompletionKind.HTML_ELEMENT, ['div', 'h1', 'h2', 'span']);
    }
  });

  it('should be able to return component directives', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'empty');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.COMPONENT, [
      'ng-form',
      'my-app',
      'ng-component',
      'test-comp',
    ]);
  });

  it('should be able to return attribute directives', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'h1-after-space');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.ATTRIBUTE, ['string-model', 'number-model']);
  });

  it('should be able to return angular pseudo elements', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'empty');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.ANGULAR_ELEMENT, [
      'ng-container',
      'ng-content',
      'ng-template',
    ]);
  });

  it('should be able to return h1 attributes', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'h1-after-space');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.HTML_ATTRIBUTE, [
      'class',
      'id',
      'onclick',
      'onmouseup',
    ]);
  });

  it('should be able to find common Angular attributes', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'div-attributes');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.ATTRIBUTE, [
      'ngClass',
      'ngForm',
      'ngModel',
      'string-model',
      'number-model',
    ]);
  });

  it('should be able to get the completions at the beginning of an interpolation', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'h2-hero');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.PROPERTY, ['title', 'hero']);
  });

  it('should not include private members of a class', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'h2-hero');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expect(completions).toBeDefined();
    const internal = completions !.entries.find(e => e.name === 'internal');
    expect(internal).toBeUndefined();
  });

  it('should be able to get the completions at the end of an interpolation', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'sub-end');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.PROPERTY, ['title', 'hero']);
  });

  it('should be able to get the completions in a property', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'h2-name');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
  });

  it('should suggest template references', () => {
    mockHost.override(TEST_TEMPLATE, `<div *~{cursor}></div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
    expectContain(completions, CompletionKind.ATTRIBUTE, [
      'ngFor',
      'ngForOf',
      'ngIf',
      'ngSwitchCase',
      'ngSwitchDefault',
      'ngPluralCase',
    ]);
  });

  it('should be able to return attribute names with an incomplete attribute', () => {
    const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'no-value-attribute');
    const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
    expectContain(completions, CompletionKind.HTML_ATTRIBUTE, ['id', 'class', 'dir', 'lang']);
  });

  it('should be able to return attributes of an incomplete element', () => {
    const m1 = mockHost.getLocationMarkerFor(PARSING_CASES, 'incomplete-open-lt');
    const c1 = ngLS.getCompletionsAt(PARSING_CASES, m1.start);
    expectContain(c1, CompletionKind.HTML_ELEMENT, ['a', 'div', 'p', 'span']);

    const m2 = mockHost.getLocationMarkerFor(PARSING_CASES, 'incomplete-open-a');
    const c2 = ngLS.getCompletionsAt(PARSING_CASES, m2.start);
    expectContain(c2, CompletionKind.HTML_ELEMENT, ['a', 'div', 'p', 'span']);

    const m3 = mockHost.getLocationMarkerFor(PARSING_CASES, 'incomplete-open-attr');
    const c3 = ngLS.getCompletionsAt(PARSING_CASES, m3.start);
    expectContain(c3, CompletionKind.HTML_ATTRIBUTE, ['id', 'class', 'href', 'name']);
  });

  it('should be able to return completions with a missing closing tag', () => {
    const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'missing-closing');
    const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
    expectContain(completions, CompletionKind.HTML_ELEMENT, ['a', 'div', 'p', 'span', 'h1', 'h2']);
  });

  it('should be able to return common attributes of an unknown tag', () => {
    const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'unknown-element');
    const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
    expectContain(completions, CompletionKind.HTML_ATTRIBUTE, ['id', 'dir', 'lang']);
  });

  it('should be able to get completions in an empty interpolation', () => {
    const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'empty-interpolation');
    const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
    expectContain(completions, CompletionKind.PROPERTY, ['title', 'subTitle']);
  });

  it('should suggest $any() type cast function in an interpolation', () => {
    const marker = mockHost.getLocationMarkerFor(APP_COMPONENT, 'sub-start');
    const completions = ngLS.getCompletionsAt(APP_COMPONENT, marker.start);
    expectContain(completions, CompletionKind.METHOD, ['$any']);
  });

  it('should suggest attribute values', () => {
    mockHost.override(TEST_TEMPLATE, `<div [id]="~{cursor}"></div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
    expectContain(completions, CompletionKind.PROPERTY, [
      'title',
      'hero',
      'heroes',
      'league',
      'anyValue',
    ]);
  });

  it('should suggest event handlers', () => {
    mockHost.override(TEST_TEMPLATE, `<div (click)="~{cursor}"></div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
    expectContain(completions, CompletionKind.METHOD, ['myClick']);
  });

  it('for methods should include parentheses', () => {
    mockHost.override(TEST_TEMPLATE, `<div (click)="~{cursor}"></div>`);
    const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
    const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
    expect(completions).toBeDefined();
    expect(completions !.entries).toContain(jasmine.objectContaining({
      name: 'myClick',
      kind: CompletionKind.METHOD as any,
      insertText: 'myClick()',
    }));
  });

  describe('in external template', () => {
    it('should be able to get entity completions in external template', () => {
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'entity-amp');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.ENTITY, ['&amp;', '&gt;', '&lt;', '&iota;']);
    });

    it('should not return html elements', () => {
      const locations = ['empty', 'start-tag-h1', 'h1-content', 'start-tag', 'start-tag-after-h'];
      for (const location of locations) {
        const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, location);
        const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
        expect(completions).toBeDefined();
        const {entries} = completions !;
        expect(entries).not.toContain(jasmine.objectContaining({name: 'div'}));
        expect(entries).not.toContain(jasmine.objectContaining({name: 'h1'}));
        expect(entries).not.toContain(jasmine.objectContaining({name: 'h2'}));
        expect(entries).not.toContain(jasmine.objectContaining({name: 'span'}));
      }
    });

    it('should be able to return element directives', () => {
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'empty');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.COMPONENT, [
        'ng-form',
        'my-app',
        'ng-component',
        'test-comp',
      ]);
    });

    it('should not return html attributes', () => {
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'h1-after-space');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expect(completions).toBeDefined();
      const {entries} = completions !;
      expect(entries).not.toContain(jasmine.objectContaining({name: 'class'}));
      expect(entries).not.toContain(jasmine.objectContaining({name: 'id'}));
      expect(entries).not.toContain(jasmine.objectContaining({name: 'onclick'}));
      expect(entries).not.toContain(jasmine.objectContaining({name: 'onmouseup'}));
    });

    it('should be able to find common Angular attributes', () => {
      mockHost.override(TEST_TEMPLATE, `<div ~{cursor}></div>`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.ATTRIBUTE, [
        'ngClass',
        'ngForm',
        'ngModel',
        'string-model',
        'number-model',
      ]);
    });
  });

  describe('with a *ngIf', () => {
    it('should be able to get completions for exported *ngIf variable', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'promised-person-name');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['name', 'age', 'street']);
    });
  });

  describe('with a *ngFor', () => {
    it('should suggest NgForRow members for let initialization expression', () => {
      mockHost.override(TEST_TEMPLATE, `<div *ngFor="let i=~{cursor}"></div>`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, [
        '$implicit',
        'ngForOf',
        'index',
        'count',
        'first',
        'last',
        'even',
        'odd',
      ]);
    });

    it('should not provide suggestion before the = sign', () => {
      mockHost.override(TEST_TEMPLATE, `<div *ngFor="let i~{cursor}="></div>`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expect(completions).toBeUndefined();
    });

    it('should include field reference', () => {
      mockHost.override(TEST_TEMPLATE, `<div *ngFor="let x of ~{cursor}"></div>`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['title', 'heroes', 'league']);
      // the symbol 'x' declared in *ngFor is also in scope. This asserts that
      // we are actually taking the AST into account and not just referring to
      // the symbol table of the Component.
      expectContain(completions, CompletionKind.VARIABLE, ['x']);
    });

    it('should include variable in the let scope in interpolation', () => {
      mockHost.override(TEST_TEMPLATE, `
        <div *ngFor="let h of heroes">
          {{~{cursor}}}
        </div>
      `);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.VARIABLE, ['h']);
    });

    it('should be able to infer the type of a ngForOf', () => {
      mockHost.override(TEST_TEMPLATE, `
        <div *ngFor="let h of heroes">
          {{ h.~{cursor} }}
        </div>
      `);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
    });

    it('should be able to infer the type of a ngForOf with an async pipe', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'async-person-name');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['name', 'age', 'street']);
    });

    it('should be able to resolve variable in nested loop', () => {
      mockHost.override(TEST_TEMPLATE, `
        <div *ngFor="let leagueMembers of league">
          <div *ngFor="let member of leagueMembers">
            {{member.~{position}}}
          </div>
        </div>
      `);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'position');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      // member variable of type Hero has properties 'id' and 'name'.
      expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
    });
  });

  describe('data binding', () => {
    it('should be able to complete property value', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'property-binding-model');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['test']);
    });

    it('should be able to complete an event', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'event-binding-model');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.METHOD, ['modelChanged']);
    });

    it('should be able to complete a the LHS of a two-way binding', () => {
      mockHost.override(TEST_TEMPLATE, `<div [(~{cursor})]></div>`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.ATTRIBUTE, ['ngModel']);
    });

    it('should be able to complete a the RHS of a two-way binding', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'two-way-binding-model');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['test']);
    });

    it('should suggest property binding for input', () => {
      // Property binding via []
      mockHost.override(TEST_TEMPLATE, `<div number-model [~{cursor}]></div>`);
      const m1 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c1 = ngLS.getCompletionsAt(TEST_TEMPLATE, m1.start);
      expectContain(c1, CompletionKind.ATTRIBUTE, ['inputAlias']);

      // Property binding via bind-
      mockHost.override(TEST_TEMPLATE, `<div number-model bind-~{cursor}></div>`);
      const m2 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c2 = ngLS.getCompletionsAt(TEST_TEMPLATE, m2.start);
      expectContain(c2, CompletionKind.ATTRIBUTE, ['inputAlias']);
    });

    it('should suggest event binding for output', () => {
      // Event binding via ()
      mockHost.override(TEST_TEMPLATE, `<div number-model (~{cursor})></div>`);
      const m1 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c1 = ngLS.getCompletionsAt(TEST_TEMPLATE, m1.start);
      expectContain(c1, CompletionKind.ATTRIBUTE, ['outputAlias']);

      // Event binding via on-
      mockHost.override(TEST_TEMPLATE, `<div number-mode on-~{cursor}></div>`);
      const m2 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c2 = ngLS.getCompletionsAt(TEST_TEMPLATE, m2.start);
      expectContain(c2, CompletionKind.ATTRIBUTE, ['outputAlias']);
    });

    it('should suggest two-way binding for input and output', () => {
      // Banana-in-a-box via [()]
      mockHost.override(TEST_TEMPLATE, `<div string-model [(~{cursor})]></div>`);
      const m1 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c1 = ngLS.getCompletionsAt(TEST_TEMPLATE, m1.start);
      expectContain(c1, CompletionKind.ATTRIBUTE, ['model']);

      // Banana-in-a-box via bindon-
      mockHost.override(TEST_TEMPLATE, `<div string-model bindon-~{cursor}></div>`);
      const m2 = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'cursor');
      const c2 = ngLS.getCompletionsAt(TEST_TEMPLATE, m2.start);
      expectContain(c2, CompletionKind.ATTRIBUTE, ['model']);
    });
  });

  describe('for pipes', () => {
    it('should be able to get a list of pipe values', () => {
      for (const location of ['before-pipe', 'in-pipe', 'after-pipe']) {
        const marker = mockHost.getLocationMarkerFor(PARSING_CASES, location);
        const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
        expectContain(completions, CompletionKind.PIPE, [
          'async',
          'uppercase',
          'lowercase',
          'titlecase',
        ]);
      }
    });

    it('should be able to resolve lowercase', () => {
      const marker = mockHost.getLocationMarkerFor(EXPRESSION_CASES, 'string-pipe');
      const completions = ngLS.getCompletionsAt(EXPRESSION_CASES, marker.start);
      expectContain(completions, CompletionKind.METHOD, [
        'charAt',
        'replace',
        'substring',
        'toLowerCase',
      ]);
    });
  });

  describe('with references', () => {
    it('should list references', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'test-comp-content');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.REFERENCE, ['div', 'test1', 'test2']);
    });

    it('should reference the component', () => {
      const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'test-comp-after-test');
      const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['name', 'testEvent']);
    });

    // TODO: Enable when we have a flag that indicates the project targets the DOM
    // it('should reference the element if no component', () => {
    //   const marker = mockHost.getLocationMarkerFor(PARSING_CASES, 'test-comp-after-div');
    //   const completions = ngLS.getCompletionsAt(PARSING_CASES, marker.start);
    //   expectContain(completions, CompletionKind.PROPERTY, ['innerText']);
    // });
  });

  describe('replacement span', () => {
    it('should not generate replacement entries for zero-length replacements', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <div>{{obj.~{key}}}</div>
          \`,
        })
        export class FooComponent {
          obj: {key: 'value'};
        }
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'key');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'key') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('property');
      expect(completion.replacementSpan).toBeUndefined();
    });

    it('should work for start of template', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`~{start}abc\`,
        })
        export class FooComponent {}
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'start');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'acronym') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('html element');
      expect(completion.replacementSpan).toEqual({start: location.start, length: 3});
    });

    it('should work for end of template', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`acro~{end}\`,
        })
        export class FooComponent {}
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'end');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'acronym') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('html element');
      expect(completion.replacementSpan).toEqual({start: location.start - 4, length: 4});
    });

    it('should work for middle-word replacements', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <div>{{obj.ke~{key}key}}</div>
          \`,
        })
        export class FooComponent {
          obj: {key: 'value'};
        }
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'key');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'key') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('property');
      expect(completion.replacementSpan).toEqual({start: location.start - 2, length: 5});
    });

    it('should work for all kinds of identifier characters', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <div>{{~{field}$title_1}}</div>
          \`,
        })
        export class FooComponent {
          $title_1: string;
        }
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'field');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === '$title_1') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('property');
      expect(completion.replacementSpan).toEqual({start: location.start, length: 8});
    });

    it('should work for attributes', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <div (cl~{click})></div>
          \`,
        })
        export class FooComponent {}
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'click');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'click') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe(CompletionKind.ATTRIBUTE);
      expect(completion.replacementSpan).toEqual({start: location.start - 2, length: 2});
    });

    it('should work for events', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <div (click)="han~{handleClick}"></div>
          \`,
        })
        export class FooComponent {
          handleClick() {}
        }
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'handleClick');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'handleClick') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('method');
      expect(completion.replacementSpan).toEqual({start: location.start - 3, length: 3});
    });

    it('should work for element names', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <di~{div}></div>
          \`,
        })
        export class FooComponent {}
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'div');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'div') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe('html element');
      expect(completion.replacementSpan).toEqual({start: location.start - 2, length: 2});
    });

    it('should work for bindings', () => {
      const fileName = mockHost.addCode(`
        @Component({
          selector: 'foo-component',
          template: \`
            <input [(ngMod~{model})] />
          \`,
        })
        export class FooComponent {}
      `);
      const location = mockHost.getLocationMarkerFor(fileName, 'model');
      const completions = ngLS.getCompletionsAt(fileName, location.start) !;
      expect(completions).toBeDefined();
      const completion = completions.entries.find(entry => entry.name === 'ngModel') !;
      expect(completion).toBeDefined();
      expect(completion.kind).toBe(CompletionKind.ATTRIBUTE);
      expect(completion.replacementSpan).toEqual({start: location.start - 5, length: 5});
    });
  });

  describe('property completions for members of an indexed type', () => {
    it('should work with numeric index signatures (arrays)', () => {
      mockHost.override(TEST_TEMPLATE, `{{ heroes[0].~{heroes-number-index}}}`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'heroes-number-index');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
    });

    it('should work with numeric index signatures (tuple arrays)', () => {
      mockHost.override(TEST_TEMPLATE, `{{ tupleArray[1].~{tuple-array-number-index}}}`);
      const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'tuple-array-number-index');
      const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
      expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
    });

    describe('with string index signatures', () => {
      it('should work with index notation', () => {
        mockHost.override(TEST_TEMPLATE, `{{ heroesByName['Jacky'].~{heroes-string-index}}}`);
        const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'heroes-string-index');
        const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
        expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
      });

      it('should work with dot notation', () => {
        mockHost.override(TEST_TEMPLATE, `{{ heroesByName.jacky.~{heroes-string-index}}}`);
        const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'heroes-string-index');
        const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
        expectContain(completions, CompletionKind.PROPERTY, ['id', 'name']);
      });

      it('should work with dot notation if stringIndexType is a primitive type', () => {
        mockHost.override(TEST_TEMPLATE, `{{ primitiveIndexType.test.~{string-primitive-type}}}`);
        const marker = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'string-primitive-type');
        const completions = ngLS.getCompletionsAt(TEST_TEMPLATE, marker.start);
        expectContain(completions, CompletionKind.METHOD, ['substring']);
      });
    });
  });
});

function expectContain(
    completions: ts.CompletionInfo | undefined, kind: CompletionKind, names: string[]) {
  expect(completions).toBeDefined();
  for (const name of names) {
    expect(completions !.entries).toContain(jasmine.objectContaining({ name, kind } as any));
  }
}
