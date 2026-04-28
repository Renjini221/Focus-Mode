import * as vscode from 'vscode';

const FUNCTION_REGEX=/^\s*(async\s+)?(function\s+\w+|[\w]+\s*[:=]\s*(async\s+)?(\(|function)|def\s+\w+|func\s+\w+|fn\s+\w+|(public|private|protected|static|async)[\w\s]*\s+\w+\s*\()/;

function getFunctionLines(doc:vscode.TextDocument):number[]{
    const lines:number[]=[];
    for(let i=0;i<doc.lineCount;i++){
        if(FUNCTION_REGEX.test(doc.lineAt(i).text)){
            lines.push(i)
    
        }
    }
return lines;
}


async function foldOthers() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const cursorLine = editor.selection.active.line;
    const doc=editor.document;
    const funcLines=getFunctionLines(doc);

    if(funcLines.length===0){
        vscode.window.showInformationMessage('No function found in this file');
        return;
    }

    let currentFuncLine=funcLines[0];
    for(const line of funcLines){
        if(line <=cursorLine)currentFuncLine=line;
        else break;
    }

    await vscode.commands.executeCommand('editor.unfoldAll');

    for(const line of funcLines){
        if(line !==currentFuncLine){
            await vscode.commads.executeCommand('editor.fold',{
                selectionLines:[line],
                levels:1,
            });
        }
    }
vscode.window.showInformationMessage(
    `focused on function at line ${surrentFuncLine+1} press alt+f again or use "Unfols all"to restore`

);
}
let highlightDecoration:vscode.TextEditorDecorationType|null=null;
let highlightedWord='';

function highlightUsages(){
    const editor=vscode.window.activeTextEditor;
    if(!editor) return;

    const selection=editor.selection;
    const word=selection.isEmpty
      ?editor.document.getText(editor.document.getWordRangeAtPosition(selectio.active))
      : editor.document.getText(selection);

    if(!word.trim()){
        vscode.window.showInformationMessage('Place your cursor on a word select text first.');
        return;
    }
    if(word===highlightedWord&&highlightDecoration){
        highlightDecoration.dispose();
        hightlightDecoration=null;
        highlightedWord='';
        return;
    }  

    if(highlightDecoration){
        hightlightDecoration.dispose();
        highlightDecoration=null;
    }
    highlightDecoration=vscode.window.createTextEditorDecorationType({
        backgroundColor:`rgba(255,255,255,0,0.25)`,
        border:`1px solid rgba(255,200,0,0.6)`,
        borderRadius:'2px',
    });
    const text= editor.document.getText();
    const ranges:vscode.Range[]=[];
    const escapedWord=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const regex=new RegExp('\\b${escapeedWord}\\b','g');

    let match:RegExpExecArray|null;
    while((match=regex.exec(text))!==null){
        const start=editor.document.positionAt(match.index);
        const end=editor.document.positionAt(match.index+word.length);
        ranges.push(new vscode.Range(start,end));
    }
    editor.setDecorations(highlightDecoration,ranges);
    highlightesWord=word;

    vscode.window.showInformationMessage(
        `Found ${ranges.length} usage${ranges.length !==1?'s':''}of"${word}".Run again on same word to clear`

    );
    
}