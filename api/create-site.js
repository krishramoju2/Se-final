export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { idea, token } = req.body;
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  // 1. Get username
  const uRes = await fetch('https://api.github.com/user', {headers: {Authorization: 'token ' + token}});
  const user = await uRes.json();
  if (!user.login) return res.status(400).json({ error: "GitHub auth failed" });
  const repo = 'tiny-site-' + Date.now();
  // 2. Create repo
  await fetch('https://api.github.com/user/repos', {
    method:'POST',
    headers:{Authorization:'token '+token,'Content-Type':'application/json'},
    body:JSON.stringify({name:repo,description:idea,auto_init:true})
  });
  // 3. Add index.html file
  const indexHtml = `
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
</html>
  `;
  await fetch(`https://api.github.com/repos/${user.login}/${repo}/contents/index.html`, {
    method: 'PUT',
    headers: {Authorization:'token '+token,'Content-Type':'application/json'},
    body: JSON.stringify({
      message:"Initial commit: Add homepage",
      content: Buffer.from(indexHtml).toString('base64')
    })
  });
  // 4. Enable Pages
  await fetch(`https://api.github.com/repos/${user.login}/${repo}/pages`, {
    method: 'POST',
    headers: {Authorization:'token '+token,'Content-Type':'application/json'},
    body: JSON.stringify({source:{branch:"main",path:"/"}})
  });
  // 5. Return site URL
  const url = `https://${user.login}.github.io/${repo}/`;
  res.status(200).json({url});
}
