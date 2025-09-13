export default async function handler(req, res) {
  const code = req.query.code;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method:'POST',
    headers:{Accept:'application/json'},
    body:new URLSearchParams({client_id, client_secret, code})
  });
  const {access_token} = await tokenRes.json();
  // Redirect to frontend with token in query
  const frontend = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  res.redirect(`${frontend}/?token=${access_token}`);
}
