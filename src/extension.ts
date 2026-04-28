import * as vscode from 'vscode';

const FUNCTION_REGEX = /^\s*(async\s+)?(function\s+\w+|[\w]+\s*[:=]\s*(async\s+)?(\(|function)|def\s+\w+|func\s+\w+|fn\s+\w+|(public|private|protected|static|async)[\w\s]*\s+\w+\s*\()/;

function getFunctionLines(doc: vscode.TextDocument): number[] {
  const lines: number[] = [];
  for (let i = 0; i < doc.lineCount; i++) {
    if (FUNCTION_REGEX.test(doc.lineAt(i).text)) {
      lines.push(i);
    }
  }
  return lines;
}

async function foldOthers() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const cursorLine = editor.selection.active.line;
  const doc = editor.document;
  const funcLines = getFunctionLines(doc);

  if (funcLines.length === 0) {
    vscode.window.showInformationMessage('No functions found in this file.');
    return;
  }

  
  let currentFuncLine = funcLines[0];
  for (const line of funcLines) {
    if (line <= cursorLine) currentFuncLine = line;
    else break;
  }

  await vscode.commands.executeCommand('editor.unfoldAll');

  for (const line of funcLines) {
    if (line !== currentFuncLine) {
      await vscode.commands.executeCommand('editor.fold', {
        selectionLines: [line],
        levels: 1,
      });
    }
  }

  vscode.window.showInformationMessage(
    `Focused on function at line ${currentFuncLine + 1}. Press Alt+F again or use "Unfold All" to restore.`
  );
}

let highlightDecoration: vscode.TextEditorDecorationType | null = null;
let highlightedWord = '';

function highlightUsages() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;
  const word = selection.isEmpty
    ? editor.document.getText(editor.document.getWordRangeAtPosition(selection.active))
    : editor.document.getText(selection);

  if (!word.trim()) {
    vscode.window.showInformationMessage('Place your cursor on a word or select text first.');
    return;
  }

  if (word === highlightedWord && highlightDecoration) {
    highlightDecoration.dispose();
    highlightDecoration = null;
    highlightedWord = '';
    return;
  }

  if (highlightDecoration) {
    highlightDecoration.dispose();
    highlightDecoration = null;
  }

  highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 200, 0, 0.25)',
    border: '1px solid rgba(255, 200, 0, 0.6)',
    borderRadius: '2px',
  });

  const text = editor.document.getText();
  const ranges: vscode.Range[] = [];
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const start = editor.document.positionAt(match.index);
    const end = editor.document.positionAt(match.index + word.length);
    ranges.push(new vscode.Range(start, end));
  }

  editor.setDecorations(highlightDecoration, ranges);
  highlightedWord = word;

  vscode.window.showInformationMessage(
    `Found ${ranges.length} usage${ranges.length !== 1 ? 's' : ''} of "${word}". Run again on same word to clear.`
  );
}

function jumpToFunction(direction: 'next' | 'prev') {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const cursorLine = editor.selection.active.line;
  const funcLines = getFunctionLines(editor.document);

  if (funcLines.length === 0) {
    vscode.window.showInformationMessage('No functions found in this file.');
    return;
  }

  let targetLine: number | undefined;

  if (direction === 'next') {
    targetLine = funcLines.find(l => l > cursorLine);
    if (targetLine === undefined) {
      vscode.window.showInformationMessage('Already at the last function.');
      return;
    }
  } else {
    const prev = funcLines.filter(l => l < cursorLine);
    targetLine = prev[prev.length - 1];
    if (targetLine === undefined) {
      vscode.window.showInformationMessage('Already at the first function.');
      return;
    }
  }

  const pos = new vscode.Position(targetLine, 0);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('focusMode.foldOthers', foldOthers),
    vscode.commands.registerCommand('focusMode.highlightUsages', highlightUsages),
    vscode.commands.registerCommand('focusMode.nextFunction', () => jumpToFunction('next')),
    vscode.commands.registerCommand('focusMode.prevFunction', () => jumpToFunction('prev')),

    vscode.window.onDidChangeActiveTextEditor(() => {
      if (highlightDecoration) {
        highlightDecoration.dispose();
        highlightDecoration = null;
        highlightedWord = '';
      }
    })
  );
}

export function deactivate() {
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
}