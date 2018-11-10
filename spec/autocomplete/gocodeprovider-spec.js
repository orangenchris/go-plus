/* eslint-env jasmine */

import path from 'path'
import { lifecycle } from './../spec-helpers'
import {it, fit, ffit, beforeEach} from '../async-spec-helpers' // eslint-disable-line


fdescribe('gocodeprovider', () => {
  let completionDelay = null
  let provider = null
  let editor = null
  let editorView = null
  let suggestionsPromise = null

  beforeEach(async () => {
    lifecycle.setup()
    const pkg = await atom.packages.activatePackage('autocomplete-plus')
    const autocompleteplusMain = pkg.mainModule

    waitsFor(() => {
      return (
        autocompleteplusMain.autocompleteManager &&
        autocompleteplusMain.autocompleteManager.ready
      )
    })

    await lifecycle.activatePackage()
    const { mainModule } = lifecycle
    provider = mainModule.provideAutocomplete()

    const workspaceElement = atom.views.getView(atom.workspace)
    jasmine.attachToDOM(workspaceElement)

    atom.config.set('autocomplete-plus.enableAutoActivation', true)
    completionDelay = 100
    atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay)
    completionDelay += 100 // Rendering delay

    atom.config.set('go-plus.autocomplete.snippetMode', 'nameAndType')
    spyOn(provider, 'getSuggestions').andCallThrough()
    provider.onDidGetSuggestions(p => {
      suggestionsPromise = p
    })

    expect(provider).toBeDefined()
    expect(provider.getSuggestions).not.toHaveBeenCalled()
  })

  afterEach(() => {
    lifecycle.teardown()
  })

  describe('when the basic file is opened', () => {
    beforeEach(async () => {
      editor = await atom.workspace.open('basic' + path.sep + 'main.go')
      editorView = atom.views.getView(editor)
      expect(editorView.querySelector('.autocomplete-plus')).not.toExist()
    })

    describe('when snippetMode is nameAndType', () => {
      beforeEach(() => {
        atom.config.set('go-plus.autocomplete.snippetMode', 'nameAndType')
      })

      it('generates snippets with name and type argument placeholders', async () => {
        let suggestions = null
        editor.setCursorScreenPosition([5, 6])
        editor.insertText('P')
        advanceClock(completionDelay)

        waitsFor(() => {
          return (
            provider.getSuggestions.calls.length === 1 &&
            suggestionsPromise !== null
          )
        })

        suggestions = await suggestionsPromise
        expect(provider.getSuggestions).toHaveBeenCalled()
        expect(provider.getSuggestions.calls.length).toBe(1)
        expect(suggestions).toBeTruthy()
        expect(suggestions.length).toBeGreaterThan(0)
        expect(suggestions[0]).toBeTruthy()
        expect(suggestions[0].displayText).toBe('Print(a ...interface{})')
        expect(suggestions[0].snippet).toBe('Print()$0')
        expect(suggestions[0].replacementPrefix).toBe('P')
        expect(suggestions[0].type).toBe('function')
        expect(suggestions[0].leftLabel).toBe('(n int, err error)')
      })
    })

    describe('when snippetMode is name', () => {
      beforeEach(() => {
        atom.config.set('go-plus.autocomplete.snippetMode', 'name')
      })

      it('generates snippets with name argument placeholders', async () => {
        let suggestions = null
        editor.setCursorScreenPosition([5, 6])
        editor.insertText('P')
        advanceClock(completionDelay)

        waitsFor(() => {
          return (
            provider.getSuggestions.calls.length === 1 &&
            suggestionsPromise !== null
          )
        })

        suggestions = await suggestionsPromise
        expect(provider.getSuggestions).toHaveBeenCalled()
        expect(provider.getSuggestions.calls.length).toBe(1)
        expect(suggestions).toBeTruthy()
        expect(suggestions.length).toBeGreaterThan(0)
        expect(suggestions[0]).toBeTruthy()
        expect(suggestions[0].displayText).toBe('Print(a ...interface{})')
        expect(suggestions[0].snippet).toBe('Print()$0')
        expect(suggestions[0].replacementPrefix).toBe('P')
        expect(suggestions[0].type).toBe('function')
        expect(suggestions[0].leftLabel).toBe('(n int, err error)')
      })
    })

    describe('when snippetMode is none', () => {
      beforeEach(() => {
        atom.config.set('go-plus.autocomplete.snippetMode', 'none')
      })

      it('generates snippets with no args', async () => {
        let suggestions = null
        editor.setCursorScreenPosition([5, 6])
        editor.insertText('P')
        advanceClock(completionDelay)

        waitsFor(() => {
          return (
            provider.getSuggestions.calls.length === 1 &&
            suggestionsPromise !== null
          )
        })

        suggestions = await suggestionsPromise
        expect(provider.getSuggestions).toHaveBeenCalled()
        expect(provider.getSuggestions.calls.length).toBe(1)
        expect(suggestions).toBeTruthy()
        expect(suggestions.length).toBeGreaterThan(0)
        expect(suggestions[0]).toBeTruthy()
        expect(suggestions[0].displayText).toBe('Print(a ...interface{})')
        expect(suggestions[0].snippet).toBe('Print($1)$0')
        expect(suggestions[0].replacementPrefix).toBe('P')
        expect(suggestions[0].type).toBe('function')
        expect(suggestions[0].leftLabel).toBe('(n int, err error)')
      })
    })

    describe('provides suggestions for unimported packages', () => {
      beforeEach(() => {
        atom.config.set('go-plus.autocomplete.snippetMode', 'nameAndType')
        atom.config.set('go-plus.autocomplete.unimportedPackages', true)
      })

      it('provides the exported types of the unimported package', async () => {
        let suggestions = null
        waitsFor(() => provider.allPkgs.size > 0)
        editor.setCursorScreenPosition([7, 0])
        editor.insertText('ioutil')
        advanceClock(completionDelay)
        editor.insertText('.')
        advanceClock(completionDelay)

        waitsFor(() => {
          return (
            provider.getSuggestions.calls.length === 1 &&
            suggestionsPromise !== null
          )
        })

        suggestions = await suggestionsPromise
        expect(provider.getSuggestions).toHaveBeenCalled()
        expect(provider.getSuggestions.calls.length).toBe(1)
        expect(suggestions).toBeTruthy()
        expect(suggestions.length).toBeGreaterThan(0)
        expect(suggestions[0]).toBeTruthy()
        expect(suggestions[0].displayText).toBe('NopCloser(r io.Reader)')
      })
    })
  })

  // TODO revisit
  xdescribe('when the go-plus-issue-745 file is opened', () => {
    let suggestions = null
    beforeEach(async () => {
      editor = await atom.workspace.open(
        'go-plus-issue-745' + path.sep + 'main.go'
      )
      editorView = atom.views.getView(editor)
    })

    it('calculates the prefix correctly', async () => {
      editor.setCursorBufferPosition([4, 10])
      suggestions = null
      suggestionsPromise = null
      advanceClock(completionDelay)

      expect(provider.getSuggestions.calls.length).toBe(0)
      expect(suggestionsPromise).toBeFalsy()
      editor.insertText('t')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 1 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions.calls.length).toBe(1)
      expect(suggestionsPromise).toBeTruthy()
      suggestionsPromise = null
      editor.insertText('t')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 2 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions).toHaveBeenCalled()
      expect(provider.getSuggestions.calls.length).toBe(2)
      expect(suggestions).toBeTruthy()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeTruthy()
      expect(suggestions[0].text).toBe('net/http')
      expect(suggestions[0].replacementPrefix).toBe('net/htt')
    })
  })

  describe('when the go-plus-issue-307 file is opened', () => {
    let suggestions = null
    beforeEach(async () => {
      editor = await atom.workspace.open(
        'go-plus-issue-307' + path.sep + 'main.go'
      )
      editorView = atom.views.getView(editor)
    })

    it('returns suggestions to autocomplete-plus scenario 1', async () => {
      editor.setCursorScreenPosition([13, 0])
      editor.insertText('\tSayHello("world")')
      suggestions = null
      suggestionsPromise = null
      advanceClock(completionDelay)

      expect(provider.getSuggestions.calls.length).toBe(0)
      expect(suggestionsPromise).toBeFalsy()
      editor.insertText('.')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 1 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions).toHaveBeenCalled()
      expect(provider.getSuggestions.calls.length).toBe(1)
      expect(suggestions).toBeTruthy()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeTruthy()
      expect(suggestions[0].displayText).toBe('Fatal(v ...interface{})')
      expect(suggestions[0].snippet).toBe('Fatal()$0')
      expect(suggestions[0].replacementPrefix).toBe('')
      expect(suggestions[0].type).toBe('function')
      expect(suggestions[0].leftLabel).toBe('')
    })

    it('returns suggestions to autocomplete-plus scenario 2', async () => {
      editor.setCursorScreenPosition([13, 0])
      editor.insertText('\tSayHello("world") ')
      suggestions = null
      suggestionsPromise = null
      advanceClock(completionDelay)

      expect(provider.getSuggestions.calls.length).toBe(0)
      expect(suggestionsPromise).toBeFalsy()
      editor.insertText('.')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 1 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions).toHaveBeenCalled()
      expect(provider.getSuggestions.calls.length).toBe(1)
      expect(suggestions).toBeTruthy()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeTruthy()
      expect(suggestions[0].displayText).toBe('Fatal(v ...interface{})')
      expect(suggestions[0].snippet).toBe('Fatal()$0')
      expect(suggestions[0].replacementPrefix).toBe('')
      expect(suggestions[0].type).toBe('function')
      expect(suggestions[0].leftLabel).toBe('')
    })

    it('returns suggestions to autocomplete-plus scenario 3', async () => {
      editor.setCursorScreenPosition([13, 0])
      editor.insertText('\tSayHello("world")  ')
      suggestions = null
      suggestionsPromise = null
      advanceClock(completionDelay)

      expect(provider.getSuggestions.calls.length).toBe(0)
      expect(suggestionsPromise).toBeFalsy()
      editor.insertText('.')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 1 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions).toHaveBeenCalled()
      expect(provider.getSuggestions.calls.length).toBe(1)
      expect(suggestions).toBeTruthy()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeTruthy()
      expect(suggestions[0].displayText).toBe('Fatal(v ...interface{})')
      expect(suggestions[0].snippet).toBe('Fatal()$0')
      expect(suggestions[0].replacementPrefix).toBe('')
      expect(suggestions[0].type).toBe('function')
      expect(suggestions[0].leftLabel).toBe('')
    })

    // TODO: Atom's prefix regex of: /(\b|['"~`!@#$%^&*(){}[\]=+,/?>])((\w+[\w-]*)|([.:;[{(< ]+))$/
    // returns an empty prefix when a '.' character is preceded by a \t
    xit('returns suggestions to autocomplete-plus scenario 4', async () => {
      editor.setCursorScreenPosition([13, 0])
      editor.insertText('\tSayHello("world")\t')
      suggestions = null
      suggestionsPromise = null
      advanceClock(completionDelay)

      expect(provider.getSuggestions.calls.length).toBe(0)
      expect(suggestionsPromise).toBeFalsy()

      editor.insertText('.')
      advanceClock(completionDelay)

      waitsFor(() => {
        return (
          provider.getSuggestions.calls.length === 1 &&
          suggestionsPromise !== null
        )
      })

      suggestions = await suggestionsPromise

      expect(provider.getSuggestions).toHaveBeenCalled()
      expect(provider.getSuggestions.calls.length).toBe(1)
      expect(suggestions).toBeTruthy()
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toBeTruthy()
      expect(suggestions[0].displayText).toBe('Fatal(v ...interface{})')
      expect(suggestions[0].snippet).toBe('Fatal()$0')
      expect(suggestions[0].replacementPrefix).toBe('')
      expect(suggestions[0].type).toBe('function')
      expect(suggestions[0].leftLabel).toBe('')
    })
  })
})
