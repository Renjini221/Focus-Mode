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

    