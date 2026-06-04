// Code execution utilities

export interface ExecutionResult {
  logs: string[]
  error?: string
}

// Deprecated in favor of secure backend code execution via /api/execute
export const executeCode = (code: string, language: string): ExecutionResult => {
  void code
  void language
  return {
    logs: ['⚠️ Client-side browser execution is deprecated. Please use the secure backend runner.'],
    error: 'Execution deprecated'
  }
}

/**
 * Humanize technical error messages for beginners
 */
const humanizeError = (error: string): string => {
  const err = error.toLowerCase();
  
  if (err.includes('unexpected token')) {
    if (err.includes(')')) return 'Có vẻ bạn đang thiếu hoặc thừa một dấu ngoặc đơn `()`. Hãy kiểm tra lại nhé!';
    if (err.includes('}')) return 'Có vẻ bạn đang thiếu hoặc thừa một dấu ngoặc nhọn `{}`. Hãy kiểm tra các khối lệnh nhé!';
    return 'Cú pháp có chỗ chưa đúng. Hãy kiểm tra xem có thiếu dấu phẩy `,`, dấu chấm phẩy `;` hay dấu ngoặc nào không.';
  }
  
  if (err.includes('is not defined')) {
    const varName = error.split(' ')[0];
    return `Máy tính không biết \`${varName}\` là gì. Bạn đã khai báo biến này chưa? (Hãy dùng \`let\` hoặc \`const\`)`;
  }
  
  if (err.includes('is not a function')) {
    const name = error.split(' ')[0];
    return `\`${name}\` không phải là một hàm. Bạn có nhầm lẫn khi gọi nó bằng dấu ngoặc \`()\` không?`;
  }

  if (err.includes('can\'t set properties of null') || err.includes('reading \'')) {
    return 'Bạn đang cố gắng truy cập vào một thứ không tồn tại (null hoặc undefined).';
  }

  return error;
};

// Format error message for display
export const formatError = (error: string): string => {
  const friendlyMessage = humanizeError(error);
  return `❌ LỖI: ${friendlyMessage}\n\n💡 Gợi ý: Kiểm tra kỹ các ký tự đặc biệt và tên biến của bạn.`;
}
