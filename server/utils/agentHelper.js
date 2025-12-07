/**
 * Constructs a standard JSON-RPC 2.0 request body.
 * @param {string} text - The message text to send to the agent.
 * @param {string} sessionId - The session ID (default: 'session456').
 * @param {string} taskId - The task ID (default: 'task124').
 * @returns {object} The JSON-RPC request object.
 */
exports.createRpcBody = (text, sessionId = 'session456', taskId = 'task124') => {
  return {
    "jsonrpc": "2.0",
    "id": taskId,
    "method": "tasks/send",
    "params": {
      "sessionId": sessionId,
      "message": {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": text
          }
        ]
      }
    }
  };
};

/**
 * Extracts and parses JSON content from an Agent's JSON-RPC response.
 * Handles markdown code blocks and raw text.
 * @param {object} responseData - The raw API response data.
 * @returns {object|null} The parsed JSON object or null if extraction fails.
 */
exports.parseAgentResponse = (responseData) => {
  try {
    let textContent = '';
    
    // Navigate to the text part of the response
    // Structure: result -> status -> message -> parts[0] -> text
    // OR: result -> artifacts[0] -> parts[0] -> text
    const result = responseData.result;
    
    if (result?.status?.message?.parts?.[0]?.text) {
      textContent = result.status.message.parts[0].text;
    } else if (result?.artifacts?.[0]?.parts?.[0]?.text) {
      textContent = result.artifacts[0].parts[0].text;
    }

    if (!textContent) return null;

    // Clean up markdown code blocks if present
    const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || textContent.match(/```\s*([\s\S]*?)\s*```/);
    const cleanJson = jsonMatch ? jsonMatch[1] : textContent;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error parsing agent response:', error);
    return null;
  }
};

/**
 * Extracts the raw text message from an Agent's response.
 * Useful for checking error messages or non-JSON responses.
 * @param {object} responseData 
 * @returns {string} The text content.
 */
exports.getAgentResponseText = (responseData) => {
  const result = responseData.result;
  if (result?.status?.message?.parts?.[0]?.text) {
    return result.status.message.parts[0].text;
  } else if (result?.artifacts?.[0]?.parts?.[0]?.text) {
    return result.artifacts[0].parts[0].text;
  }
  return '';
};
