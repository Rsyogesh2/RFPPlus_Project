
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs')

router.post('/addSuperUser', async (req, res) => {

    const {newUser,assignModule} = req.body;
    //console.log(assignModule)
  try {
    const query = `
      INSERT INTO SuperAdmin_Users (
        entity_name, entity_sub_name, entity_landline, entity_address, entity_city, 
        entity_pin_code, entity_country, super_user_name, designation, 
        super_user_email, super_user_mobile, valid_from, valid_to, active_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      newUser.entityName,
      newUser.entitySubName,
      newUser.entityLandline,
      newUser.entityAddress,
      newUser.entityCity,
      newUser.entityPinCode,
      newUser.entityCountry,
      newUser.superUserName,
      newUser.designation,
      newUser.superUserEmail,
      newUser.superUserMobile,
      newUser.validFrom,
      newUser.validTo,
      newUser.activeFlag,
    ]
    //console.log('User adding');
    await db.query(query, values);
    //console.log('User added successfully');
    const assignedQuery = `INSERT INTO Assingned_Rfp_SuperUser (entity_Name, email, modules) VALUES (?, ?, ?)`;

    assignModule.forEach((module) => {
      db.query(
        assignedQuery,
        [newUser.entityName, newUser.superUserEmail, module],
        (err, result) => {
          if (err) {
            console.error("Error inserting data:", err.message);
          } else {
            //console.log(`Module ${module} inserted successfully`);
          }
        }
      );
    });

    
    const password = "system@123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
      
    const query1 = "INSERT INTO Users_Login (Username, Password,Role,Entity_Name) VALUES (?, ?,?, ?)";
    db.query(query1, [newUser.superUserEmail, hashedPassword,"Super Admin",newUser.entityName], (err, results) => {
        if (err) throw err;
        //console.log("User created!");
    })    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry detected:', err.message);
    } else {
      console.error('Error adding user:', err.message);
    }
  } finally {
  }
});
router.put('/updateSuperUser/:id', async (req, res) => {
  const userId = req.params.id;
  const { updatedUser, assignModule } = req.body; // Ensure these are properly structured
  //console.log(req.body);

  try {
    const formattedValidFrom = new Date(updatedUser.validFrom).toISOString().slice(0, 10);
    const formattedValidTo = new Date(updatedUser.validTo).toISOString().slice(0, 10);
    

    const query = `
      UPDATE SuperAdmin_Users
      SET 
        entity_name = ?, entity_sub_name = ?, entity_landline = ?, entity_address = ?, 
        entity_city = ?, entity_pin_code = ?, entity_country = ?, super_user_name = ?, 
        designation = ?, super_user_email = ?, super_user_mobile = ?, valid_from = ?, 
        valid_to = ?, active_flag = ?
      WHERE user_id = ?
    `;

    const values = [
      updatedUser.entityName,
      updatedUser.entitySubName,
      updatedUser.entityLandline,
      updatedUser.entityAddress,
      updatedUser.entityCity,
      updatedUser.entityPinCode,
      updatedUser.entityCountry,
      updatedUser.superUserName,
      updatedUser.designation,
      updatedUser.superUserEmail,
      updatedUser.superUserMobile,
      formattedValidFrom,  // Correctly formatted date
      formattedValidTo,    // Correctly formatted date
      updatedUser.activeFlag,
      userId,
  ];
  

    await db.query(query, values);
    //console.log('User updated successfully');

    // Clear existing module assignments for this user
    // await db.query(
    //   `DELETE FROM Assingned_Rfp_SuperUser WHERE email = ?`,
    //   [updatedUser.superUserEmail]
    // );

    // // Reassign updated modules
    // const assignedQuery = `INSERT INTO Assingned_Rfp_SuperUser (entity_Name, email, modules) VALUES (?, ?, ?)`;
    // assignModule.forEach((module) => {
    //   db.query(
    //     assignedQuery,
    //     [updatedUser.entityName, updatedUser.superUserEmail, module],
    //     (err) => {
    //       if (err) {
    //         console.error("Error updating modules:", err.message);
    //       } else {
    //         //console.log(`Module ${module} updated successfully`);
    //       }
    //     }
    //   );
    // });

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});


router.delete('/deleteSuperUser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Retrieve email before deletion for removing assignments
    const [result] = await db.query(
      `SELECT super_user_email FROM SuperAdmin_Users WHERE user_id = ?`, // Use the correct column name
      [userId]
    );
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userEmail = result[0].super_user_email;

    // Delete user from SuperAdmin_Users table
    await db.query(`DELETE FROM SuperAdmin_Users WHERE user_id = ?`, [userId]);

    // Delete assignments from Assingned_Rfp_SuperUser
    await db.query(
      `DELETE FROM Assingned_Rfp_SuperUser WHERE email = ?`,
      [userEmail]
    );

    // Delete login details from Users_Login
    await db.query(`DELETE FROM Users_Login WHERE Username = ?`, [userEmail]);

    //console.log('User and related data deleted successfully');
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});



router.get('/getSuperUsers', async (req, res) => {
    try {
      const query = `SELECT 
        user_id AS id,
        entity_name AS entityName, 
        entity_sub_name AS entitySubName, 
        entity_landline AS entityLandline, 
        entity_address AS entityAddress, 
        entity_city AS entityCity, 
        entity_pin_code AS entityPinCode, 
        entity_country AS entityCountry, 
        super_user_name AS superUserName, 
        designation, 
        super_user_email AS superUserEmail, 
        super_user_mobile AS superUserMobile, 
        valid_from AS validFrom, 
        valid_to AS validTo, 
        active_flag AS activeFlag 
        FROM SuperAdmin_Users`;
  
      const [rows] = await db.query(query); // Assuming you're using a promise-based MySQL client like `mysql2`
      //console.log(rows)
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching users:', err.message);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
router.post('/addUser', async (req, res) => {
    const { id, userName, designation, email, mobile, activeFlag } = req.body;
    const creatorName = req.body.emailId; // Extract separate userName field
    const userPower = req.body.userPower; // Extract separate userName field
    //console.log("id "+ id);
    //console.log(id, userName, designation, email, mobile, activeFlag );
    //console.log(creatorName);
    //console.log(userPower);
    
    try { 
      let entity;
      // Query to get entity and super user details based on creatorName
      if(userPower=="Vendor Admin"){
        entity = `SELECT entity_name, admin_name FROM Vendor_Admin_Users WHERE email = ?`;
      } else if(userPower=="Super Admin"){
        entity = `SELECT entity_name, super_user_name FROM SuperAdmin_Users WHERE super_user_email = ?`;
      }
      const [suDetails] = await db.query(entity, [creatorName]);
      //console.log(suDetails[0].entity_name);
  
      // Get count of users created by creatorName and add 1 to it
      // const count = `SELECT COUNT(email) + 1 AS no FROM Users_Table WHERE createdby = ?`;
      let count;
      if(userPower=="Vendor Admin"){
        count = `SELECT COUNT(email) + 1 AS no FROM Vendor_Users_Table WHERE createdby = ?`;
      } else if(userPower=="Super Admin"){
        count = `SELECT COUNT(email) + 1 AS no FROM Users_Table WHERE createdby = ?`;
      }
      const [no] = await db.query(count, [creatorName]);
      //console.log(no[0].no);
      let query;
      // Insert user details into Users_Table
      if(userPower=="Vendor Admin"){
         query = `
        INSERT INTO Vendor_Users_Table (user_no, user_name, designation, email, mobile, active_flag, entity_Name, createdby) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      } else if(userPower=="Super Admin"){
         query = `
        INSERT INTO Users_Table (user_no, user_name, designation, email, mobile, active_flag, entity_Name, createdby) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      }
      
      
      const values = [
        no[0].no,           // User number
        userName,           // User name
        designation,        // Designation
        email,              // Email
        mobile,             // Mobile number
        activeFlag,         // Active flag
        suDetails[0].entity_name,                 // Entity name (empty string)
        creatorName         // Created by (creator's email)
      ];
      
      // Execute the insert query
      const [result] = await db.query(query, values);
      res.status(200).json({ success: true, userId: result.insertId });
  
      // Insert login details into Users_Login table
      const password = "system@123";
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const query1 = "INSERT INTO Users_Login (Username, Password, Role, Entity_Name) VALUES (?, ?, ?, ?)";

      if(userPower=="Vendor Admin"){
        db.query(query1, [email, hashedPassword, "Vendor User", suDetails[0].entity_name], (err, results) => {
          if (err) throw err;
          //console.log("User created!");
      }); 
      } else if(userPower=="Super Admin"){
        db.query(query1, [email, hashedPassword, "User", suDetails[0].entity_name], (err, results) => {
          if (err) throw err;
          //console.log("User created!");
      });
      }
     
    } catch (err) {
      console.error('Error adding user:', err.message);
      res.status(500).json({ success: false, error: 'Failed to add user' });
    }
  });
  
  router.get('/getusers', async (req, res) => {
    try {
        const { createdBy, userPower } = req.query;
        if (!createdBy || !userPower) {
            //console.log("Missing 'createdBy' or 'userPower' parameter");
            return res.status(400).json({ error: "'createdBy' and 'userPower' parameters are required" });
        }
        //console.log("createdBy received:", createdBy);
        //console.log("userPower received:", userPower);

        let query;
        if (userPower === "Vendor Admin") {
            query = `SELECT user_no, user_name, designation, email, mobile, active_flag FROM Vendor_Users_Table WHERE createdby = ?`;
        } else if (userPower === "Super Admin") {
            query = `SELECT user_no, user_name, designation, email, mobile, active_flag FROM Users_Table WHERE createdby = ?`;
        } else {
            return res.status(400).json({ error: "Invalid 'userPower' parameter" });
        }

        const [results] = await db.query(query, [createdBy]);
        //console.log("Query results:", results);
        res.json(results);
    } catch (err) {
        console.error("Error fetching users:", err.message);
        res.status(500).send("Internal Server Error");
    }
});

// router.get('/getusers', async (req, res) => {
//     try {
//         const { createdBy } = req.query
//         if (!createdBy) {
//             //console.log("Missing 'createdBy' parameter");
//             return res.status(400).json({ error: "'createdBy' parameter is required" });
//         }
//         //console.log("createdBy received:", createdBy);

//         const query = `SELECT user_no, user_name, designation, email, mobile, active_flag FROM Users_Table WHERE createdby = ?`;
//         const [results] = await db.query(query, [createdBy]);
//         //console.log("Query results:", results);
//         res.json(results);
//     } catch (err) {
//         console.error("Error fetching users:", err.message);
//         res.status(500).send("Internal Server Error");
//     }
// });

router.put('/users/:id', async (req, res) => {
  try {
    //console.log("update user");
    const { id } = req.params;
    const { user_name, designation, email, mobile, active_flag, createdBy, userPower } = req.body;

    //console.log(id, user_name);

    let query;
    if (userPower === "Vendor Admin") {
        query = `
          UPDATE Vendor_Users_Table
          SET user_name = ?, designation = ?, email = ?, mobile = ?, active_flag = ?
          WHERE user_no = ? AND createdby = ?
        `;
    } else if (userPower === "Super Admin") {
        query = `
          UPDATE Users_Table
          SET user_name = ?, designation = ?, email = ?, mobile = ?, active_flag = ?
          WHERE user_no = ? AND createdby = ?
        `;
    } else {
        return res.status(400).json({ error: "Invalid 'userPower' parameter" });
    }

    await db.query(query, [user_name, designation, email, mobile, active_flag, id, createdBy]);
    res.send("User updated successfully");
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).send("Error updating user");
  }
});


// router.put('/users/:id', async (req, res) => {
//   try {
//     //console.log("update user")
//     const { id } = req.params;
    
//     const { user_name, designation, email, mobile, active_flag ,createdBy} = req.body;
//     //console.log(id,user_name)
//     const query = `
//       UPDATE Users_Table
//       SET user_name = ?, designation = ?, email = ?, mobile = ?, active_flag = ?
//       WHERE user_no = ? and createdBy = ?
//     `;
//     await db.query(query, [user_name, designation, email, mobile, active_flag, id,createdBy]);
//     res.send("User updated successfully");
//   } catch (err) {
//     console.error("Error updating user:", err.message);
//     res.status(500).send("Error updating user");
//   }
// });

router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { createdBy, userPower } = req.body; // Assuming createdBy and userPower are passed in the request body.

  try {
    let fetchEmailQuery;
    let deleteUserQuery;

    if (userPower === "Vendor Admin") {
        fetchEmailQuery = `SELECT email FROM Vendor_Users_Table WHERE user_no = ? AND createdby = ?`;
        deleteUserQuery = `DELETE FROM Vendor_Users_Table WHERE user_no = ? AND createdby = ?`;
    } else if (userPower === "Super Admin") {
        fetchEmailQuery = `SELECT email FROM Users_Table WHERE user_no = ? AND createdby = ?`;
        deleteUserQuery = `DELETE FROM Users_Table WHERE user_no = ? AND createdby = ?`;
    } else {
        return res.status(400).json({ error: "Invalid 'userPower' parameter" });
    }

    // Fetch the user's email before deletion
    const [user] = await db.query(fetchEmailQuery, [userId, createdBy]);

    if (!user.length) {
      return res.status(404).json({ error: 'User not found or unauthorized' });
    }

    const userEmail = user[0].email;

    // Delete the user from the respective table
    await db.query(deleteUserQuery, [userId, createdBy]);

    // Delete the user's login details from `Users_Login`
    const deleteLoginQuery = `DELETE FROM Users_Login WHERE Username = ?`;
    await db.query(deleteLoginQuery, [userEmail]);

    res.status(200).json({ success: true, message: 'User and login details deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});


// router.delete('/users/:id', async (req, res) => {
//   const userId = req.params.id;
//   const { createdBy } = req.body; // Assuming createdBy is passed in the request body for validation.

//   try {
//     // Fetch the user's email from the `Users_Table` before deletion
//     const fetchEmailQuery = `SELECT email FROM Users_Table WHERE user_no = ? AND createdby = ?`;
//     const [user] = await db.query(fetchEmailQuery, [userId, createdBy]);

//     if (!user.length) {
//       return res.status(404).json({ error: 'User not found or unauthorized' });
//     }
//     const userEmail = user[0].email;

//     // Delete user from `Users_Table`
//     const deleteUserQuery = `DELETE FROM Users_Table WHERE user_no = ? AND createdby = ?`;
//     await db.query(deleteUserQuery, [userId, createdBy]);

//     // Delete user's login details from `Users_Login` using their email
//     const deleteLoginQuery = `DELETE FROM Users_Login WHERE Username = ?`;
//     await db.query(deleteLoginQuery, [userEmail]);

//     res.status(200).json({ success: true, message: 'User and login details deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting user:', err.message);
//     res.status(500).json({ success: false, error: 'Failed to delete user' });
//   }
// });



router.get('/getModule', async (req, res) => {
  try {
    const query = `SELECT user_no, user_name, designation, email, mobile, active_flag FROM Users_Table`;
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).send('Error fetching users');
  }
});

router.post("/saveassignUserModules", async (req, res) => {
  const { assignedUsers, rfpNo, selectedModules, userName,userPower } = req.body;
  console.log(assignedUsers);
  console.log(userName);
  console.log(rfpNo);

  if (!assignedUsers || assignedUsers.length === 0 || !rfpNo) {
    return res.status(400).json({ message: "Invalid data provided" });
  }

  try {
    // Loop through assigned users and insert or update based on existing records
    for (const user of assignedUsers) {
      const checkQuery = `
        SELECT COUNT(*) AS count 
        FROM User_Modules_Assignment 
        WHERE rfp_no = ? AND user_name = ?`;

      const [result] = await db.query(checkQuery, [rfpNo, user.user_name]);
      const recordExists = result[0].count > 0;
      console.log(user.selectedModules);
      console.log(`Record exists: ${recordExists} for user: ${user.user_name} and rfp_no: ${rfpNo}`);

      // const query = recordExists
      //   ? `
      //     UPDATE User_Modules_Assignment 
      //     SET 
      //       is_active = ?, 
      //       date_from = ?, 
      //       date_to = ?, 
      //       is_maker = ?, 
      //       is_authorizer = ?, 
      //       is_reviewer = ?, 
      //       module_name = ? 
      //     WHERE rfp_no = ? AND user_name = ?`
      //   : `
      //     INSERT INTO User_Modules_Assignment 
      //     (user_name, createdby, is_active, date_from, date_to, is_maker, is_authorizer, is_reviewer, module_name, rfp_no) 
      //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
       
      let query;
    // Step 2: Fetch Assigned Users
    if(userPower=="Super User"){
       query = `
      INSERT INTO User_Modules_Assignment 
      (user_name, createdby, is_active, date_from, date_to, is_maker, is_authorizer, is_reviewer, module_name, rfp_no) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        is_active = VALUES(is_active),
        date_from = VALUES(date_from),
        date_to = VALUES(date_to),
        is_maker = VALUES(is_maker),
        is_authorizer = VALUES(is_authorizer),
        is_reviewer = VALUES(is_reviewer),
        module_name = VALUES(module_name)
    `;   
  } else if(userPower=="Vendor Admin"){
     query = `
      INSERT INTO VendorUser_Modules_Assignment 
      (user_name, createdby, is_active, date_from, date_to, is_maker, is_authorizer, is_reviewer, module_name, rfp_no) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        is_active = VALUES(is_active),
        date_from = VALUES(date_from),
        date_to = VALUES(date_to),
        is_maker = VALUES(is_maker),
        is_authorizer = VALUES(is_authorizer),
        is_reviewer = VALUES(is_reviewer),
        module_name = VALUES(module_name)
    `;   
  }
      // console.log("Executing query:", query);

      const values = [
        user.user_name,
        userName,
        user.active ? 1 : 0, // Store as 1 or 0
        user.fromDate || null,
        user.toDate || null,
        user.maker ? 1 : 0, // Store as 1 or 0
        user.authorizer ? 1 : 0, // Store as 1 or 0
        user.reviewer ? 1 : 0,
        JSON.stringify(user.selectedModules || []), // Default to an empty array
        rfpNo,
    ];
    

      // console.log("With values:", values);

      await db.query(query, values);
    }

    res.status(200).json({ success: true, message: "Users assigned successfully" });
  } catch (err) {
    console.error("Error inserting/updating data:", err.message);
    res.status(500).json({ success: false, message: "Failed to assign users" });
  }
});



router.get("/getAssignedUsers", async (req, res) => {
  const { rfpNo } = req.query;

  if (!rfpNo) {
    return res.status(400).json({ message: "RFP Number is required" });
  }

  try {
    const query = `
      SELECT 
        user_name AS userName, 
        is_active AS active, 
        date_from AS fromDate, 
        date_to AS toDate, 
        is_maker AS maker, 
        is_authorizer AS authorizer, 
        is_reviewer AS reviewer, 
        module_name AS module ,
        rfp_no
      FROM User_Modules_Assignment
      WHERE rfp_no = ?`;
    const [results] = await db.query(query, [rfpNo]); // Use your DB query method
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ success: false, message: "Failed to fetch data" });
  }
});

router.post('/api/vendor-admin', async (req, res) => {
  const {
    rfpReferenceNo,
    entityName,
    entitySubName,
    entityLandline,
    entityAddress,
    city,
    pinCode,
    country,
    adminName,
    designation,
    email,
    mobile,
    validFrom,
    validTo,
    activeFlag,
  } = req.body.formData;
  const creatorName = req.body.userName;
  try {
    const query = `
      INSERT INTO Vendor_Admin_Users (
        rfp_reference_no, entity_name, entity_sub_name, entity_landline,
        entity_address, city, pin_code, country, admin_name, designation,
        email, mobile, valid_from, valid_to, active_flag, createdby
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
    const values = [
      rfpReferenceNo, entityName, entitySubName, entityLandline,
      entityAddress, city, pinCode, country, adminName, designation,
      email, mobile, validFrom, validTo, activeFlag, creatorName
    ];

    await db.query(query, values);
    res.status(200).json({ success: true, message: "Vendor Admin data saved successfully" });
    const password = "system@123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
      const query1 = "INSERT INTO Users_Login (Username, Password, Role, Entity_Name) VALUES (?, ?, ?, ?)";
      db.query(query1, [email, hashedPassword, "Vendor Admin", entityName], (err, results) => {
      if (err) throw err;
          //console.log("User created!");
      });
  } catch (err) {
    console.error("Error saving vendor admin data:", err.message);
    res.status(500).json({ success: false, error: "Failed to save vendor admin data" });
  }
});



module.exports = router;