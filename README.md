# greenhill_finance_game
## Getting Started

### Prerequisites
- Download MySQL Workbench
    - Will need to create an account if you don't have one already
    - Make sure to remember your password (will be used in later steps)
- Clone `greenhill_finance_game` repo and `frontend-development` repo from Git
- Make sure you have Node.js installed

### How to set up dev environment
#### MySQL Workbench
1. In MySQL Workbench, under `MySQL Connections` click on `Local instance MySQL80`
    - You will need to enter your password that you used when downloading MySQL Workbench
    - If you don't see `Local instance MySQL80`, follow the steps below:
        - Open `MySQL Installer` from the start menu
        - Click `Add ...` on the right navigation bar
        - Expand `MySQL Servers` and install `MySQL Server 8.0` by selecting `MySQL Server 8.0.32 - x64` and clicking the right green arrow
        - Follow the onscreen instructions (you will need to enter in the password, **make sure you remember it**)
        - Restart your MySQL Workbench
        - Click the plus sign to create a new connections
        - 
2. Once you're logged in, you will need to create a new schema
    - Click on the icon that looks like the database with the plus sign
    - Enter in `greenhill_localhost` as the name of the new schema
    - Click `Apply`
    - In the new window, you can copy and paste the MySQL script from `create-tables.sql` file located in the `greenhill_finance_game/app/sql` repo
3. Once you create the tables you will see the `Schemas` on the left navigation bar as well as all the tables created from using the script

#### Visual Studio
1. Create one folder that has both `frontend-development` and `greenhill_finance_game` repos
2. Within Visual Studio, open two terminals:
    - In one terminal, navigate to `..\frontend-development\app`
        - Run the command `npm install`
    - In other terminal, navigate to `..\greenhill_finance_game\app`
        - Run the command `npm install` and `npm install mysql`
3. In the `greenhill_finance_game\config.json` file, you will need to add your password for the MySQL database
    - Create a new key called `db_localhost` and give it a value of `"{YOUR MYSQL PASSWORD}"`

#### Run Project Locally
1. Have two terminals open
    - In one terminal, navigate to `..\greenhill_finance_game\app`
        - Run the command `node server.js`
    - In other terminal, navigate to `..\frontend-development\app`
        - Run the command `npm start`