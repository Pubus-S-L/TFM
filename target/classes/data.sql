INSERT INTO authorities(id,authority) VALUES (1,'ADMIN')
INSERT INTO authorities(id,authority) VALUES (2,'USER')

INSERT INTO users(id,first_name,last_name,username,email,password,authority) VALUES (1,'admin','admin','admin','admin@admin.com','$2a$12$0YF2Y27tOHyNWjBLse.lR.huVfIavOX2yPh5v6SEu4FdJB92CK5ke',1)
INSERT INTO users(id,first_name,last_name,username,email,password,authority) VALUES (2,'Pedro','Pino','user','pedro@gmail.com','$2a$12$9x3hBRJuJZalMw8HnvJ7OuqRj3ZGI1NlrLSpN9v4qatz1bNq1rxw2',2)

INSERT INTO types(id,name) VALUES (1,'Article')
INSERT INTO types(id,name) VALUES (2,'Book')
INSERT INTO types(id,name) VALUES (3,'Manual')
INSERT INTO types(id,name) VALUES (4,'PhD thesis')
INSERT INTO types(id,name) VALUES (5,'Masters thesis')
INSERT INTO types(id,name) VALUES (6,'Technical report')
INSERT INTO types(id,name) VALUES (7,'Dissertation')
INSERT INTO types(id,name) VALUES (8,'Essay')
INSERT INTO types(id,name) VALUES (9,'Paper')
INSERT INTO types(id,name) VALUES (10,'Book-chapter')
INSERT INTO types(id,name) VALUES (11,'Booklet')
INSERT INTO types(id,name) VALUES (12,'Conferene')
INSERT INTO types(id,name) VALUES (13,'Other')

INSERT INTO papers(id,title,authors,publication_year,type_id,abstract_content,notes,keywords,user_id) VALUES(1,'Title article','Pedro P.',2019,1,'An article about science', 'A short article', 'article, science',2)
INSERT INTO papers(id,title,authors,publication_year,type_id,abstract_content,notes,keywords,user_id) VALUES(2,'My thesis','Paco O., Pedro P.',2024,5,'A thesis about informatics', 'Use of complexity knowledge for the efficiency of code ', 'complexity, efficiency, code',2)


INSERT INTO company(id,name,description,phone,email,support_phone,support_email) VALUES(1,'PUBUS.SL','Publication Management Company',928647327,'company@pubus.com',926541873,'support@pubus.com')