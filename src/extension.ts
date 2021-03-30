// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const insertText = (val: string) => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor?.selection;
	const lineOfSelectedVar = selection?.active.line;
	editor?.edit((editBuilder) => {
		editBuilder.insert(new vscode.Position(lineOfSelectedVar! + 1, 0), val);
	});
};

const insertTimeLogText = () => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor?.selection;
	const startLine = selection?.start.line;
	const endLine = selection?.end.line;
	if (startLine !== undefined && endLine !== undefined) {
		editor?.edit((editBuilder) => {
			editBuilder.insert(new vscode.Position(startLine, 0), 'console.time();\n');
			editBuilder.insert(new vscode.Position(endLine + 1, 0), 'console.timeEnd();\n');
		});
	}
};

const getAllLogStatements = () => {
	const editor = vscode.window.activeTextEditor;
	const document = editor?.document;
	const documentText = document?.getText();

	let logStatements = [];
	const logRegex = /console.(log|debug|info|warn|error|assert|dir|dirxml|trace|group|groupEnd|time|timeEnd|profile|profileEnd|count|table)\((?:[^\)])*\);?/g;
	let match;
	while (match = logRegex.exec(documentText!)) {
		let matchRange = new vscode.Range(
			document?.positionAt(match.index)!,
			document?.positionAt(match.index + match[0].length)!
		);
		if (!matchRange.isEmpty) {
			logStatements.push(matchRange);
		}
	}
	return logStatements;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const removeComments = vscode.commands.registerCommand('clear-console-log.removeComments', () => {
		const editor = vscode.window.activeTextEditor;
		editor?.edit(editBuilder => {
			let text = editor.document.getText();
			text = text.replace(/((\/\*([\w\W]+?)\*\/)|(\/\/(.(?!"\)))+)|(^\s*(?=\r?$)\n))/gm, '').replace(/(^\s*(?=\r?$)\n)/gm, '').replace(/\\n\\n\?/gm, '');
			const end = new vscode.Position(editor.document.lineCount + 1, 0);
			editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), text);
			vscode.commands.executeCommand('editor.action.formatDocument');

			vscode.window.showInformationMessage(`All comments has been removed!`);
		});
	});

	context.subscriptions.push(removeComments);

	const deleteAllLog = vscode.commands.registerCommand('clear-console-log.delLog', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const workspaceEdit = new vscode.WorkspaceEdit();
		const document = editor.document;

		const logStatements = getAllLogStatements();

		logStatements.forEach((log) => {
			workspaceEdit.delete(document.uri, log);
		});

		vscode.workspace.applyEdit(workspaceEdit).then(() => {
			vscode.window.showInformationMessage(`${logStatements.length} logs has been removed!`);
		});
	});

	context.subscriptions.push(deleteAllLog);

	const insertTimeLog = vscode.commands.registerCommand('clear-console-log.insertTimeLog', () => {
		insertTimeLogText();
	});

	context.subscriptions.push(insertTimeLog);

	const insertLog = vscode.commands.registerCommand('clear-console-log.insertLog', () => {
		const editor = vscode.window.activeTextEditor;
		const selection = editor?.selection;
		const text = editor?.document.getText(selection);

		let logToInsert;

		if (text === 'error' || text === 'err') {
			logToInsert = `console.error('${text}: ', ${text});\n`;
		} else {
			logToInsert = `console.log('${text}: ', ${text});\n`;
		}

		text ? insertText(logToInsert) : insertText(`console.log();`);
	});
	context.subscriptions.push(insertLog);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "clear-console-log" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('clear-console-log.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from clear-console-log!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
