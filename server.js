const consoleTable = require('console.table');
const inquirer = import('inquirer');
const express = require("express");
const mysql = require("mysql2");
const PORT = process.env.PORT || 3001;
const app = express();


const db = mysql.createConnection({
    host: "localhost",
    port: "3001",
    user: "root",
    password: "pop20corn",
    database: "employee_db"
})

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res) => {
    res.status(404).end();
  });
  


db.connect(function (err) {
    if (err) throw err;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      
    promptInquire();
})

const promptInquire = () => {
    inquirer.prompt({
        name: 'choice',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'View all employees',
            'Add employee',
            'Update employee role',
            'View all roles',
            'Add role',
            'View all departments',
            'Add department',
            'Quit'
        ]
    }).then(function (answer) {
        switch (answer.choice) {
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'Add employee':
                addEmployee();
                break;
            case 'Update employee role':
                updateEmployeeRole();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'Add role':
                addRole();
                break;
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'Add department':
                addDepartment();
                break;
            case 'Quit': 
                quit();
                break;
            default:
                break;

        }
    })
}
const viewAllDepartments = () => {
    const sql = 'SELECT * FROM departments'; 
    db.query(sql, (err, rows) => {
        if (err) { throw err };
        console.log("/n")
        console.table(rows);
        return promptInquire();
    });
};

const viewAllEmployees = () => {
    const sql = 
    `SELECT 
        employee.id, employee.first_name, employee.last_name,
        roles.title AS title,
        roles.salary AS salary,
        department.dpt_name AS department,
        CONCAT (manager.first_name, " ", manager.last_name) AS manager
    FROM employee
    LEFT JOIN roles ON employee.role_id = roles.id
    LEFT JOIN department ON roles.department_id = department.id
    LEFT JOIN employee manager ON employee.manager_id = manager.id`;
    db.query(sql, (err, rows) => {
        if(err) { throw err };
        console.log("/n")
        console.table(rows);
        return promptInquire();
    });
};

const viewAllRoles = () => {
    const sql = `SELECT roles.id, roles.title, roles.salary,
    department.name AS department
    FROM roles
    LEFT JOIN departments ON roles.department_id = department.id`;
    db.query(sql, (err, rows) => {
        if(err) {throw err };
        console.log("/n")
        console.table(rows);
        return promptInquire();
    });
};

const addDepartment = () => {
    return inquirer.prompt(
        {
            type: "input",
            name: "name",
            message: "What is the name of the department?"

        })
        .then((answer) => {
            db.query(`INSERT INTO department SET ?`, 
            {name: answer.name}, (err, answer) => {
                if(err) {throw err };
                console.log(answer);
                promptInquire();
            });
        });
};

// const roleList = () => {
//     var roleArray = [];
//     for(let i = 0; i < res.length; i++) {
//         roleArray.push(res[i].title);
//     }
//     return roleArray;
// }

const addEmployee = () => {
    return inquirer.prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
      }
    ])
    .then (answer => {
      const params = [answer.firstName, answer.lastName];
      const sql = `SELECT * FROM roles`;
      db.query(sql, (err, rows) => {
        if (err) {throw err};

        const roles = rows.map(({title, id}) => ({name: title, value: id}));
        inquirer.prompt([
          {
            type: "list",
            name: "role",
            message: "What is the role of this employee?",
            choices: roles
          }
        ])
        .then(roleAnswer => {
          const role = roleAnswer.role;
          params.push(role);
          const sql = `SELECT * FROM employees`;
          db.query(sql, (err, rows) => {
            if (err) {throw err};
            
            const managerChoice = rows.map(({first_name, last_name, id}) => ({name: `${first_name} ${last_name}`, value: id}));
            
            managerChoice.push({name: "No manager", value: null});
            inquirer.prompt([
              {
                type: "list",
                name: "manager",
                message: "Who is this employee's manager?",
                choices: managerChoice
              }
            ])
            .then(managerAnswer => {
              const manager = managerAnswer.manager;
              params.push(manager);
              const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                VALUES (?, ?, ?, ?)`;
              db.query(sql, params, (err) => {
                if (err) {
                  throw err;
                }
                console.log("Employee added!");
                return viewEmployees();
              });
            });
          });
        });
      });
    });
  };

const addRole = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "title",
            message: "What is the name of this role?"
        },
        {
            type: "input",
            name: "salary",
            message: "What is the salary for this role?"
        }
    ])
    .then (answer => {
        const options = [answer.title, answer.salary];
        const sql = `SELECT * FROM department`;
        db.query(sql, (err, rows) => {
            if (err) {throw err};
            const departmentList = rows.map(({names, id}) => ({name: names, value: id}));
        inquirer.prompt([
            {
                type: "list",
                name: "department",
                message: "What department does this role belong to?",
                choices: departmentList
            }
        ])
        .then(departmentAns => {
            const department = departmentAns.department;
            options.push(department);
            const sql = `INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)`;
            db.query(sql, params, (err) => {
                if (err) {throw err};
            });
            inquirePrompt();
        });
        });
    });
};

const quit = () => {
    db.end();
}
