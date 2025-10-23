const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key không được cấu hình trên server.' }) };
    }

    try {
        const { message, systemPrompt, messages } = JSON.parse(event.body);

        let payloadMessages = [];

        if (Array.isArray(messages) && messages.length > 0) {
            payloadMessages = messages
                .filter((entry) => entry && typeof entry.role === 'string' && typeof entry.content === 'string')
                .map((entry) => ({ role: entry.role, content: entry.content }));

            if (systemPrompt) {
                payloadMessages = payloadMessages.filter((entry) => entry.role !== 'system');
                payloadMessages.unshift({ role: 'system', content: systemPrompt });
            } else {
                const systemIndex = payloadMessages.findIndex((entry) => entry.role === 'system');
                if (systemIndex > 0) {
                    const [systemMessage] = payloadMessages.splice(systemIndex, 1);
                    payloadMessages.unshift(systemMessage);
                }
            }
        } else {
            if (!message) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Không có tin nhắn nào được cung cấp.' }) };
            }

            if (systemPrompt) {
                payloadMessages.push({ role: 'system', content: systemPrompt });
            }
            payloadMessages.push({ role: 'user', content: message });
        }

        if (!payloadMessages.length) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Không có tin nhắn hợp lệ nào được cung cấp.' }) };
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'ft:gpt-4o-2024-08-06:vtn-architects::CRsIxlHp',
                messages: payloadMessages,
                temperature: 0.7,
            }),
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API Error:', errorData);
            return { statusCode: openaiResponse.status, body: JSON.stringify({ error: 'Lỗi từ OpenAI API.' }) };
        }

        const data = await openaiResponse.json();
        const reply = data.choices[0].message.content.trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ reply }),
        };

    } catch (error) {
        console.error('Internal Server Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Đã có lỗi xảy ra trên server.' }),
        };
    }
};
