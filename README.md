# pg-dev2-web
Web application for PostgreSQL DEV2 course

1. Clone the repo
```
git clone git@github.com:i-bash/pg-dev2app.git
```

2. Install NodeJS 9 and server packages
```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt install -y nodejs

cd pg-dev2app/server
npm install
```
3. Start server in terminal (you will have to use sudo for port 80)
```
./wspg-server <port>
```
4. Open http://localhost:<port> in web browser.
