export default function handler(req, res) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const redirect_uri = encodeURIComponent(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/auth-github-callback`);
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo&redirect_uri=${redirect_uri}`);
}
