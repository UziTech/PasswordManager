function encrypt(msg, key) {
	return  blowfish_encrypt(key, $.trim(msg));
}

function decrypt(msg, key) {
	return $.trim(blowfish_decrypt(key, msg));
}

function generateKey(length) {
	length = length || 40;
	var chars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ;:=+-_?.,><)(*&^%$#@!`~|{}[]";
	var newKey = "";
	for (var i = 0; i < length; i++) {
		newKey += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return newKey;
}

function getDatabase(successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (window.openDatabase) {
		var db = window.openDatabase("pws", "1.0", "PWS DB", 5 * 1024 * 1024);
		db.webSQL = true;
		db.transaction(function (tx) {
			var queriesLeft = 4;
//			if (window.location.search.indexOf("?resetall") === 0) {
//				queriesLeft += 1;
//				tx.executeSql("DROP TABLE IF EXISTS users", [], function (tx, results) {
//					queriesLeft--;
//					if (!queriesLeft) {
//						successCallback(db);
//					}
//				}, function (tx, err) {
//					errorCallback(err.message);
//				});
//			}
//			if (window.location.search.indexOf("?reset") === 0) {
//				queriesLeft += 3;
//				tx.executeSql("DROP TABLE IF EXISTS urls", [], function (tx, results) {
//					queriesLeft--;
//					if (!queriesLeft) {
//						successCallback(db);
//					}
//				}, function (tx, err) {
//					errorCallback(err.message);
//				});
//				tx.executeSql("DROP TABLE IF EXISTS usernames", [], function (tx, results) {
//					queriesLeft--;
//					if (!queriesLeft) {
//						successCallback(db);
//					}
//				}, function (tx, err) {
//					errorCallback(err.message);
//				});
//				tx.executeSql("DROP TABLE IF EXISTS passwords", [], function (tx, results) {
//					queriesLeft--;
//					if (!queriesLeft) {
//						successCallback(db);
//					}
//				}, function (tx, err) {
//					errorCallback(err.message);
//				});
//			}
			tx.executeSql("CREATE TABLE IF NOT EXISTS users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, key TEXT NOT NULL)", [], function (tx, results) {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback(db);
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
			tx.executeSql("CREATE TABLE IF NOT EXISTS urls (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE, url TEXT NOT NULL, notes TEXT NOT NULL)", [], function (tx, results) {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback(db);
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
			tx.executeSql("CREATE TABLE IF NOT EXISTS usernames (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, urlid INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE ON UPDATE CASCADE, username TEXT NOT NULL)", [], function (tx, results) {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback(db);
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
			tx.executeSql("CREATE TABLE IF NOT EXISTS passwords (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, usernameid INTEGER NOT NULL REFERENCES usernames(id) ON DELETE CASCADE ON UPDATE CASCADE, password TEXT NOT NULL)", [], function (tx, results) {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback(db);
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else if (window.indexedDB) {
		var openIndexedDB = window.indexedDB.open("pws", 1);
		openIndexedDB.onupgradeneeded = function () {
			/*
			 {"id": id, "user": user, "key": key, "password": password}
			 {"id": id, "userid": userid, "url": url, "notes": notes}
			 {"id": id, "userid": userid, "urlid": urlid, "username": username}
			 {"id": id, "userid": userid, "urlid": urlid, "usernameid": usernameid, "password": password}
			 */
			var users = openIndexedDB.result.createObjectStore("users", {keyPath: "id", autoIncrement: true});
			users.createIndex("user", "user", {unique: true});
			var urls = openIndexedDB.result.createObjectStore("urls", {keyPath: "id", autoIncrement: true});
			urls.createIndex("userid", "userid", {unique: false});
			var usernames = openIndexedDB.result.createObjectStore("usernames", {keyPath: "id", autoIncrement: true});
			usernames.createIndex("userid", "userid", {unique: false});
			usernames.createIndex("urlid", "urlid", {unique: false});
			var passwords = openIndexedDB.result.createObjectStore("passwords", {keyPath: "id", autoIncrement: true});
			passwords.createIndex("userid", "userid", {unique: false});
			passwords.createIndex("urlid", "urlid", {unique: false});
			passwords.createIndex("usernameid", "usernameid", {unique: false});
		};
		openIndexedDB.onsuccess = function () {
			var db = openIndexedDB.result;
			db.webSQL = false;
			db.onerror = function (e) {
				errorCallback(e.error);
			};
			successCallback(db);
		};
		openIndexedDB.onerror = function () {
			errorCallback("Error opening the database.");
		};
		openIndexedDB.onblocked = function () {
			errorCallback("A connection to the database is already open by another tab.");
		};
	} else {
		errorCallback("This browser does not support WebSQL or IndexedDB");
	}
}

function getUrls(db, key, userId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.readTransaction(function (tx) {
			tx.executeSql("SELECT id, url FROM urls WHERE userid = ?", [userId], function (tx, results) {

				var array = [];
				for (var i = 0; i < results.rows.length; i++) {
					var result = results.rows.item(i);
					var url = {
						id: result.id,
						url: decrypt(result.url, key)
					};
					array.push(url);
				}
				successCallback(array);
			}, function (tx, err)
			{
				errorCallback(err.message);
			});
		});
	} else {
		var results = [];
		var request = db.transaction("urls").objectStore("urls").index("userid").openCursor(userId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			if (request.result) {
				var result = request.result.value;
				var url = {
					id: result.id,
					url: decrypt(result.url, key)
				};
				results.push(url);
				request.result.continue();
			} else {
				successCallback(results);
			}
		};
	}
}

function deleteUrl(db, urlId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("DELETE FROM urls WHERE id = ?", [urlId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var queriesLeft = 3;
		var transaction = db.transaction(["urls", "usernames", "passwords"], "readwrite");
		var urlRequest = transaction.objectStore("urls").delete(urlId);
		urlRequest.onerror = function () {
			transaction.abort();
			errorCallback(urlRequest.error);
		};
		urlRequest.onsuccess = function () {
			queriesLeft--;
			if (!queriesLeft) {
				successCallback();
			}
		};
		var usernames = transaction.objectStore("usernames");
		var usernamesRequest = usernames.index("urlid").openKeyCursor(urlId);
		usernamesRequest.onerror = function () {
			transaction.abort();
			errorCallback(usernamesRequest.error);
		};
		usernamesRequest.onsuccess = function () {
			if (usernamesRequest.result) {
				usernames.delete(usernamesRequest.result.primaryKey);
				usernamesRequest.result.continue;
			} else {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback();
				}
			}
		};
		var passwords = transaction.objectStore("passwords");
		var passwordsRequest = passwords.index("urlid").openKeyCursor(urlId);
		passwordsRequest.onerror = function () {
			transaction.abort();
			errorCallback(passwordsRequest.error);
		};
		passwordsRequest.onsuccess = function () {
			if (passwordsRequest.result) {
				passwords.delete(passwordsRequest.result.primaryKey);
				passwordsRequest.result.continue;
			} else {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback();
				}
			}
		};
	}
}

function changeUrl(db, key, urlId, newUrl, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("UPDATE urls SET url = ? WHERE id = ?", [encrypt(newUrl, key), urlId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var urls = db.transaction("urls", "readwrite").objectStore("urls");
		var request = urls.get(urlId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			record.url = encrypt(newUrl, key);
			var update = urls.put(record);
			update.onerror = function () {
				errorCallback(update.error);
			};
			update.onsuccess = function () {
				successCallback();
			};
		};
	}
}

function addUrl(db, key, userId, newUrl, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("INSERT INTO urls (userid, url, notes) VALUES (?, ?, ?)", [userId, encrypt(newUrl, key), ""], function (tx, results) {
				successCallback(results.insertId);
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var request = db.transaction("urls", "readwrite").objectStore("urls").add({
			userid: userId,
			url: encrypt(newUrl, key),
			notes: ""
		});
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			successCallback(request.result);
		};
	}
}

function getUsernames(db, key, urlId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.readTransaction(function (tx) {
			tx.executeSql("SELECT id, username FROM usernames WHERE urlid = ?", [urlId], function (tx, results) {
				var array = [];
				for (var i = 0; i < results.rows.length; i++) {
					var result = results.rows.item(i);
					var username = {
						id: result.id,
						username: decrypt(result.username, key)
					};
					array.push(username);
				}
				successCallback(array);
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var results = [];
		var request = db.transaction("usernames").objectStore("usernames").index("urlid").openCursor(urlId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			if (request.result) {
				var result = request.result.value;
				var username = {
					id: result.id,
					username: decrypt(result.username, key)
				};
				results.push(username);
				request.result.continue();
			} else {
				successCallback(results);
			}
		};
	}
}

function deleteUsername(db, usernameId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("DELETE FROM usernames WHERE id = ?", [usernameId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var queriesLeft = 2;
		var transaction = db.transaction(["usernames", "passwords"], "readwrite");
		var usernameRequest = transaction.objectStore("usernames").delete(usernameId);
		usernameRequest.onerror = function () {
			transaction.abort();
			errorCallback(usernameRequest.error);
		};
		usernameRequest.onsuccess = function () {
			queriesLeft--;
			if (!queriesLeft) {
				successCallback();
			}
		};
		var passwords = transaction.objectStore("passwords");
		var passwordsRequest = passwords.index("usernameid").openKeyCursor(usernameId);
		passwordsRequest.onerror = function () {
			transaction.abort();
			errorCallback(passwordsRequest.error);
		};
		passwordsRequest.onsuccess = function () {
			if (passwordsRequest.result) {
				passwords.delete(passwordsRequest.result.primaryKey);
				passwordsRequest.result.continue;
			} else {
				queriesLeft--;
				if (!queriesLeft) {
					successCallback();
				}
			}
		};
	}
}

function changeUsername(db, key, usernameId, newUsername, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("UPDATE usernames SET username = ? WHERE id = ?", [encrypt(newUsername, key), usernameId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var usernames = db.transaction("usernames", "readwrite").objectStore("usernames");
		var request = usernames.get(usernameId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			record.username = encrypt(newUsername, key);
			var update = usernames.put(record);
			update.onerror = function () {
				errorCallback(update.error);
			};
			update.onsuccess = function () {
				successCallback();
			};
		};
	}
}

function addUsername(db, key, urlId, newUsername, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("INSERT INTO usernames (urlid, username) VALUES (?, ?)", [urlId, encrypt(newUsername, key)], function (tx, results) {
				successCallback(results.insertId);
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var transaction = db.transaction(["urls", "usernames"], "readwrite");
		var request = transaction.objectStore("urls").get(urlId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var usernameRequest = transaction.objectStore("usernames").add({
				userid: request.result.userid,
				urlid: urlId,
				username: encrypt(newUsername, key)
			});
			usernameRequest.onerror = function () {
				errorCallback(usernameRequest.error);
			};
			usernameRequest.onsuccess = function () {
				successCallback(usernameRequest.result);
			};
		};
	}
}

function getPasswords(db, key, usernameId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.readTransaction(function (tx) {
			tx.executeSql("SELECT id, password FROM passwords WHERE usernameid = ?", [usernameId], function (tx, results) {
				var array = [];
				for (var i = 0; i < results.rows.length; i++) {
					var result = results.rows.item(i);
					var password = {
						id: result.id,
						password: decrypt(result.password, key)
					};
					array.push(password);
				}
				successCallback(array);
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var results = [];
		var request = db.transaction("passwords").objectStore("passwords").index("usernameid").openCursor(usernameId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			if (request.result) {
				var result = request.result.value;
				var password = {
					id: result.id,
					password: decrypt(result.password, key)
				};
				results.push(password);
				request.result.continue();
			} else {
				successCallback(results);
			}
		};
	}
}

function deletePassword(db, passwordId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("DELETE FROM passwords WHERE id = ?", [passwordId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var request = db.transaction("passwords", "readwrite").objectStore("passwords").delete(passwordId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			successCallback();
		};
	}
}

function changePassword(db, key, passwordId, newPassword, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("UPDATE passwords SET password = ? WHERE id = ?", [encrypt(newPassword, key), passwordId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var passwords = db.transaction("passwords", "readwrite").objectStore("passwords");
		var request = passwords.get(passwordId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			record.password = encrypt(newPassword, key);
			var update = passwords.put(record);
			update.onerror = function () {
				errorCallback(update.error);
			};
			update.onsuccess = function () {
				successCallback();
			};
		};
	}
}

function addPassword(db, key, usernameId, newPassword, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("INSERT INTO passwords (usernameid, password) VALUES (?, ?)", [usernameId, encrypt(newPassword, key)], function (tx, results) {
				successCallback(results.insertId);
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var transaction = db.transaction(["usernames", "passwords"], "readwrite");
		var request = transaction.objectStore("usernames").get(usernameId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var passwordRequest = transaction.objectStore("passwords").add({
				userid: request.result.userid,
				urlid: request.result.urlid,
				usernameid: usernameId,
				password: encrypt(newPassword, key)
			});
			passwordRequest.onerror = function () {
				errorCallback(passwordRequest.error);
			};
			passwordRequest.onsuccess = function () {
				successCallback(passwordRequest.result);
			};
		};
	}
}

function getNotes(db, key, urlId, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.readTransaction(function (tx) {
			tx.executeSql("SELECT notes FROM urls WHERE id = ?", [urlId], function (tx, results) {
				successCallback(decrypt(results.rows.item(0).notes, key));
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var request = db.transaction("urls").objectStore("urls").get(urlId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			successCallback(decrypt(request.result.notes, key));
		};
	}
}

function changeNotes(db, key, urlId, newNotes, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("UPDATE urls SET notes = ? WHERE id = ?", [encrypt(newNotes, key), urlId], function (tx, results) {
				successCallback();
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var urls = db.transaction("urls", "readwrite").objectStore("urls");
		var request = urls.get(urlId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			record.notes = encrypt(newNotes, key);
			var update = urls.put(record);
			update.onerror = function () {
				errorCallback(update.error);
			};
			update.onsuccess = function () {
				successCallback();
			};
		};
	}
}

function changeUserUsername(db, key, userId, newUsername, password, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("SELECT password FROM users WHERE id = ?", [userId], function (tx, results) {
				if (password === decrypt(results.rows.item(0).password, key)) {
					tx.executeSql("SELECT id FROM users WHERE username = ?", [newUsername], function (tx, results) {
						if (results.rows.length === 0) {
							tx.executeSql("UPDATE users SET username = ?, key = ? WHERE id = ?", [newUsername, encrypt(key, newUsername + password), userId], function (tx, results) {
								successCallback();
							});
						} else if (results.rows.item(0).id === userId) {
							successCallback();
						} else {
							errorCallback("Username already exists.");
						}
					}, function (tx, err) {
						errorCallback(err.message);
					});
				} else {
					errorCallback("Invalid Password.");
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var users = db.transaction("users", "readwrite").objectStore("users");
		var request = users.get(userId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			if (password === decrypt(record.password, key)) {
				var userRequest = users.index("user").get(newUsername);
				userRequest.onerror = function () {
					errorCallback(userRequest.error);
				};
				userRequest.onsuccess = function () {
					if (userRequest.result) {
						errorCallback("Username already exists.");
					} else {
						record.user = newUsername;
						record.key = encrypt(key, newUsername + password);
						var update = users.put(record);
						update.onerror = function () {
							errorCallback(update.error);
						};
						update.onsuccess = function () {
							successCallback();
						};
					}
				};
			} else {
				errorCallback("Invalid Password.");
			}
		};
	}
}

function changeUserPassword(db, key, userId, oldPassword, newPassword, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("SELECT username, password FROM users WHERE id = ?", [userId], function (tx, results) {
				if (oldPassword === decrypt(results.rows.item(0).password, key)) {
					tx.executeSql("SELECT username FROM users WHERE id = ?", [userId], function (tx, results) {
						tx.executeSql("UPDATE users SET password = ?, key = ? WHERE id = ?", [encrypt(newPassword, key), encrypt(key, results.rows.item(0).username + newPassword), userId]);
						successCallback();
					}, function (tx, err) {
						errorCallback(err.message);
					});
				} else {
					errorCallback("Old password is invalid.");
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var users = db.transaction("users", "readwrite").objectStore("users");
		var request = users.get(userId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			var record = request.result;
			if (oldPassword === decrypt(record.password, key)) {
				record.password = encrypt(newPassword, key);
				record.key = encrypt(key, record.user + newPassword);
				var update = users.put(record);
				update.onerror = function () {
					errorCallback(update.error);
				};
				update.onsuccess = function () {
					successCallback();
				};
			} else {
				errorCallback("Invalid Password.");
			}
		};
	}
}

function deleteUser(db, key, userId, password, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("SELECT password FROM users WHERE id = ?", [userId], function (tx, results) {
				if (password === decrypt(results.rows.item(0).password, key)) {
					tx.executeSql("DELETE FROM users WHERE id = ?", [userId], function (tx, results) {
						successCallback();
					}, function (tx, err) {
						errorCallback(err.message);
					});
				} else {
					errorCallback("Invalid Password");
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var queriesLeft = 4;
		var transaction = db.transaction(["users", "urls", "usernames", "passwords"], "readwrite");
		var users = transaction.objectStore("users");
		var request = users.get(userId);
		request.onerror = function () {
			errorCallback(request.error);
		};
		request.onsuccess = function () {
			if (password === decrypt(request.result.password, key)) {
				var userRequest = users.delete(userId);
				userRequest.onerror = function () {
					transaction.abort();
					errorCallback(userRequest.error);
				};
				userRequest.onsuccess = function () {
					queriesLeft--;
					if (!queriesLeft) {
						successCallback();
					}
				};
				var urls = transaction.objectStore("usernames");
				var urlsRequest = urls.index("userid").openKeyCursor(userId);
				urlsRequest.onerror = function () {
					transaction.abort();
					errorCallback(urlsRequest.error);
				};
				urlsRequest.onsuccess = function () {
					if (urlsRequest.result) {
						urls.delete(urlsRequest.result.primaryKey);
						urlsRequest.result.continue;
					} else {
						queriesLeft--;
						if (!queriesLeft) {
							successCallback();
						}
					}
				};
				var usernames = transaction.objectStore("usernames");
				var usernamesRequest = usernames.index("userid").openKeyCursor(userId);
				usernamesRequest.onerror = function () {
					transaction.abort();
					errorCallback(usernamesRequest.error);
				};
				usernamesRequest.onsuccess = function () {
					if (usernamesRequest.result) {
						usernames.delete(usernamesRequest.result.primaryKey);
						usernamesRequest.result.continue;
					} else {
						queriesLeft--;
						if (!queriesLeft) {
							successCallback();
						}
					}
				};
				var passwords = transaction.objectStore("passwords");
				var passwordsRequest = passwords.index("userid").openKeyCursor(userId);
				passwordsRequest.onerror = function () {
					transaction.abort();
					errorCallback(passwordsRequest.error);
				};
				passwordsRequest.onsuccess = function () {
					if (passwordsRequest.result) {
						passwords.delete(passwordsRequest.result.primaryKey);
						passwordsRequest.result.continue;
					} else {
						queriesLeft--;
						if (!queriesLeft) {
							successCallback();
						}
					}
				};
			} else {
				errorCallback("Invalid Password");
			}
		};
	}
}

function login(db, username, password, successCallback, errorCallback) {
	if (typeof successCallback !== "function") {
		successCallback = $.noop;
	}
	if (typeof errorCallback !== "function") {
		errorCallback = $.noop;
	}
	if (db.webSQL) {
		db.transaction(function (tx) {
			tx.executeSql("SELECT id, password, key FROM users WHERE username = ?", [username], function (tx, results) {
				if (results.rows.length > 0) {
					//exists
					var key = decrypt(results.rows.item(0).key, username + password);
					if (decrypt(results.rows.item(0).password, key) === password) {
						successCallback({
							key: key,
							userId: results.rows.item(0).id
						});
					} else {
						errorCallback("Incorrect Password");
					}
				} else {
					//does not exist
					if (confirm("That username does not exist.\n\nWould you like to create it?")) {
						if (username !== "" || password !== "" || confirm("Are you sure you want to leave the username and password blank?")) {
							alert("Remember your password for this program. You may change it in the settings, but if you forget it there is no way to retrieve your passwords.");
							var key = generateKey(40);
							tx.executeSql("INSERT INTO users (username, password, key) VALUES (?, ?, ?)", [username, encrypt(password, key), encrypt(key, username + password)], function (tx, results) {
								successCallback({
									key: key,
									userId: results.insertId
								});
							}, function (tx, err) {
								errorCallback(err.message);
							});
						}
					}
				}
			}, function (tx, err) {
				errorCallback(err.message);
			});
		});
	} else {
		var usersTable = db.transaction("users", "readwrite").objectStore("users");
		var userRequest = usersTable.index("user").get(username);
		userRequest.onerror = function () {
			errorCallback(userRequest.error);
		};
		userRequest.onsuccess = function () {
			if (userRequest.result) {
				//exists
				var key = decrypt(userRequest.result.key, username + password);
				if (decrypt(userRequest.result.password, key) === password) {
					successCallback({
						key: key,
						userId: userRequest.result.id
					});
				} else {
					errorCallback("Incorrect Password");
				}
			} else {
				//does not exist
				if (confirm("That username does not exist.\n\nWould you like to create it?")) {
					if (username !== "" || password !== "" || confirm("Are you sure you want to leave the username and password blank?")) {
						alert("Remember your password for this program. You may change it in the settings, but if you forget it there is no way to retrieve your passwords.");
						var key = generateKey(40);
						var newUserRequest = usersTable.add({
							user: username,
							password: encrypt(password, key),
							key: encrypt(key, username + password)
						});
						newUserRequest.onerror = function () {
							errorCallback(newUserRequest.error);
						};
						newUserRequest.onsuccess = function (e) {
							successCallback({
								key: key,
								userId: newUserRequest.result
							});
						};
					}
				}
			}
		};
	}
}