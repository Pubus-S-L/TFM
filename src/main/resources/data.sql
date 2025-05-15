CREATE TABLE IF NOT EXISTS authorities (
    id INT PRIMARY KEY,
    authority VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS types (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS job (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    company VARCHAR(255),
    years INT
);

CREATE TABLE IF NOT EXISTS studies (
    id BIGINT PRIMARY KEY,
    degree VARCHAR(255),
    institution VARCHAR(255),
    graduation_year VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    profile_picture VARCHAR(255),
    profile_image MEDIUMBLOB,
    profile_image_type VARCHAR(255),
    authority INTEGER NOT NULL,
    favorites VARCHAR(1024),
    job_id BIGINT,
    FOREIGN KEY (authority) REFERENCES authorities(id),
    FOREIGN KEY (job_id) REFERENCES job(id)
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id INT NOT NULL,
  favorite_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    authors VARCHAR(255) NOT NULL,
    publication_year INTEGER NOT NULL,
    DOI VARCHAR(255),
    publisher VARCHAR(255),
    type_id INTEGER NOT NULL,
    abstract_content VARCHAR(1000),
    publication_data VARCHAR(255),
    notes TEXT,
    keywords VARCHAR(255),
    scopus VARCHAR(255),
    source VARCHAR(255),
    likes INTEGER DEFAULT 0,
    embedding BLOB,
    user_id INTEGER,
    embeddings_blob BLOB,
    FOREIGN KEY (type_id) REFERENCES types(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    support_phone VARCHAR(20),
    support_email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS paper_file (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    data BLOB NOT NULL,
    type VARCHAR(50),
    paper_id INTEGER NOT NULL,
    embeddings_blob BLOB,
    FOREIGN KEY (paper_id) REFERENCES papers(id)
);

-- INSERT INTO authorities(id,authority) VALUES (1,'ADMIN');
-- INSERT INTO authorities(id,authority) VALUES (2,'USER');

-- INSERT INTO users(id,first_name,last_name,username,email,password,authority) VALUES (1,'admin','admin','admin','admin@admin.com','$2a$12$0YF2Y27tOHyNWjBLse.lR.huVfIavOX2yPh5v6SEu4FdJB92CK5ke',1);
-- INSERT INTO users(id,first_name,last_name,username,email,password,profile_picture, profile_image,profile_image_type,authority) VALUES (2,'Pedro','Pino','user','pedro@gmail.com','$2a$12$9x3hBRJuJZalMw8HnvJ7OuqRj3ZGI1NlrLSpN9v4qatz1bNq1rxw2',null,null,null,2);

-- INSERT INTO types(id,name) VALUES (1,'Article');
-- INSERT INTO types(id,name) VALUES (2,'Book');
-- INSERT INTO types(id,name) VALUES (3,'Manual');
-- INSERT INTO types(id,name) VALUES (4,'Thesis');
-- INSERT INTO types(id,name) VALUES (5,'Technical-report');
-- INSERT INTO types(id,name) VALUES (6,'Dissertation');
-- INSERT INTO types(id,name) VALUES (7,'Essay');
-- INSERT INTO types(id,name) VALUES (8,'Paper');
-- INSERT INTO types(id,name) VALUES (9,'Book-chapter');
-- INSERT INTO types(id,name) VALUES (10,'Booklet');
-- INSERT INTO types(id,name) VALUES (11,'Conference');
-- INSERT INTO types(id,name) VALUES (12,'Other');

-- INSERT INTO papers(id,title,authors,publication_year,type_id,abstract_content,notes,keywords,likes,user_id) VALUES(1,'Title article','Pedro P.',2019,1,'An article about science', 'A short article', 'article, science',0,2);
-- INSERT INTO papers(id,title,authors,publication_year,type_id,abstract_content,notes,keywords,likes,user_id) VALUES(2,'My thesis','Paco O., Pedro P.',2024,4,'A thesis about informatics', 'Use of complexity knowledge for the efficiency of code ', 'complexity, efficiency, code',0,2);

-- INSERT INTO company(id,name,description,phone,email,support_phone,support_email) VALUES(1,'PUBUS S.L.','Publication Management Company',928647327,'company@pubus.com',926541873,'support@pubus.com');