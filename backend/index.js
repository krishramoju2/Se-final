const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const clientID = 'YOUR_GITHUB_CLIENT_ID';
const clientSecret = 'YOUR_GITHUB_CLIENT_SECRET';

const app = express();
app.use(bodyParser.json());

// OAuth: send user to GitHub login
app.get('/auth/github', (req, res) => {
  const redirect_uri = encodeURIComponent('http://localhost:3000/auth/github/callback');
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientID}&scope=repo&redirect_uri=${redirect_uri}`);
});

// OAuth callback: exchange code for token
app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method:'POST',
    headers:{Accept:'application/json'},
    body:new URLSearchParams({client_id:clientID, client_secret:clientSecret, code})
  });
  const {access_token} = await tokenRes.json();
  res.redirect('/?token='+access_token);
});

// Generate beautiful, minimal static site
function generateSite(idea) {
  // You can make this smarter, e.g. use different templates for portfolio, blog, etc.
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${idea}</title>
  <style>
    body { font-family:system-ui,sans-serif; background: #f5f7fa; color: #222; margin:0; padding:0; }
    .center { text-align:center; margin-top:15vh; }
    h1 { font-size:2.5em; margin:0.2em 0; }
    p { font-size:1.2em; }
    .card { background:#fff; display:inline-block; padding:2em 3em; border-radius:18px; box-shadow:0 4px 32px #0002; }
  </style>
</head>
<body>
  <div class="center">
    <div class="card">
      <h1>${idea}</h1>
      <p>This is your brilliant, tiny website.<br>Customize it further on GitHub!</p>
    </div>
  </div>
</body>
</html>`;
}

// API: handle site creation
app.post('/api/create-site', async (req, res) => {
  const {idea, token} = req.body;
  // Get username
  const uRes = await fetch('https://api.github.com/user', {headers: {Authorization: 'token ' + token}});
  const user = await uRes.json();
  const repo = 'tiny-site-' + Date.now();

  // 1. Create repo
  await fetch('https://api.github.com/user/repos', {
    method:'POST',
    headers:{Authorization:'token '+token,'Content-Type':'application/json'},
    body:JSON.stringify({name:repo,description:idea,auto_init:true})
  });

  // 2. Add index.html
  const indexHtml = generateSite(idea);
  await fetch(`https://api.github.com/repos/${user.login}/${repo}/contents/index.html`, {
    method: 'PUT',
    headers: {Authorization:'token '+token,'Content-Type':'application/json'},
    body: JSON.stringify({
      message:"Initial commit: Add homepage",
      content: Buffer.from(indexHtml).toString('base64')
    })
  });

  // 3. Enable Pages
  await fetch(`https://api.github.com/repos/${user.login}/${repo}/pages`, {
    method: 'POST',
    headers: {Authorization:'token '+token,'Content-Type':'application/json'},
    body: JSON.stringify({source:{branch:"main",path:"/"}})
  });

  // 4. Return site URL
  const url = `https://${user.login}.github.io/${repo}/`;
  res.json({url});
});

app.use(express.static('frontend'));
app.listen(3000,()=>console.log('Hub running at http://localhost:3000'));
