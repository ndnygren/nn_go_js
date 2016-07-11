
DROP TABLE IF EXISTS go_moves;
DROP TABLE IF EXISTS go_header;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

CREATE TABLE users
(	id INT NOT NULL AUTO_INCREMENT,
	username VARCHAR(50) NOT NULL,
	useremail VARCHAR(255),  
	started DATETIME NOT NULL,
	password VARCHAR(50),
	locked BOOLEAN NOT NULL,
	UNIQUE INDEX user_name_unique (username),  
	PRIMARY KEY (id) 
);


CREATE TABLE sessions (  
	user_id		INT NOT NULL ,  
	session_id	INT NOT NULL,  
	last_activity	DATETIME NOT NULL,  
	ip_address	VARCHAR(15)
);  

ALTER TABLE sessions ADD FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TABLE go_header (  
	game_id		INT NOT NULL AUTO_INCREMENT,  
	white_user	INT NOT NULL,  
	black_user	INT NOT NULL,  
	size		INT NOT NULL,  
	b_score		INT,
	w_score		INT,
	status		VARCHAR(1),
	created		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (game_id)
);

ALTER TABLE go_header ADD  FOREIGN KEY (white_user) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE go_header ADD  FOREIGN KEY (black_user) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TABLE go_moves (  
	game_id		INT NOT NULL,
	move_id		INT NOT NULL AUTO_INCREMENT,  
	l		INT NOT NULL,  
	r		INT NOT NULL,  
	created		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (move_id)
);

ALTER TABLE go_moves ADD  FOREIGN KEY (game_id) REFERENCES go_header (game_id) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO users(username, started, password, locked) VALUES ("Nick", NOW(), md5("fake_pass"), false);
INSERT INTO users(username, started, password, locked) VALUES ("Brick", NOW(), md5("fake_pass"), false);
INSERT INTO users(id, username, started, password, locked) VALUES (40, "R2D2", NOW(), md5("fake_pass"), false);

INSERT INTO go_header (white_user,black_user,size) VALUES (1,2,9);
INSERT INTO go_header (white_user,black_user,size) VALUES (2,1,5);
INSERT INTO go_header (white_user,black_user,size) VALUES (2,40,9);
INSERT INTO go_header (white_user,black_user,size) VALUES (40,1,9);

INSERT INTO go_moves(game_id,l,r) VALUES (1,1,1),(1,3,4),(2,0,0),(2,1,2),(2,4,4),(2,3,2);

