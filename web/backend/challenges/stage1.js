module.exports = {
  id:1, stage:1, title:'The Insider Footprint', domain:'OSINT', difficulty:'Easy', points:100,
  tools:'git log, curl, Web Browser',
  description:'An employee at Nova Tech Solutions leaked an internal Git repository before going dark. Investigate the public commits to uncover the hidden staging URL and the flag.',
  flag:'CTF{0s1nt_r3p0_m3t4d4t4_l34k}',
  resource:{ label:'Download Git Repo', url:'/challenge-files/git-repo.zip', filename:'git-repo.zip' },
  hints:[
    {no:1,text:'Check past commit logs with "git log -p"',penalty:5},
    {no:2,text:'Look at the deleted config.env file',penalty:10}
  ],
  steps:[
    {no:1, title:'Inspect the repository',
      instruction:'Download the git-repo.zip, extract it, then run "git log --oneline". How many commits are in the repository?',
      placeholder:'Number of commits', answer:'3'},
    {no:2, title:'Identify the deleted file',
      instruction:'The last commit removes a sensitive file. What is the filename?',
      placeholder:'filename (e.g. secrets.txt)', answer:'config.env'},
    {no:3, title:'Extract the flag',
      instruction:'View the deleted file contents using "git log -p". Enter the full flag you find.',
      placeholder:'CTF{...}', answer:'CTF{0s1nt_r3p0_m3t4d4t4_l34k}'}
  ]
};
