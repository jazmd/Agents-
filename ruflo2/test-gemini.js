import fetch from 'node-fetch';

const apiKey = "AIzaSyCWrG3fpauDKdCYbxSQAnouXyqJM7Xc4LQ";
const model = "gemini-2.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function test() {
  const body = {
    contents: [{ role: "user", parts: [{ text: "Hello, are you working?" }] }]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
