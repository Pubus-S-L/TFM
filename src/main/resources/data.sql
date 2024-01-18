INSERT INTO authorities(id,authority) VALUES (1,'ADMIN')
INSERT INTO authorities(id,authority) VALUES (2,'USER')

INSERT INTO users(id,first_name,last_name,username,email,password,authority) VALUES (1,'admin','admin','admin','admin@admin.com','$2a$12$0YF2Y27tOHyNWjBLse.lR.huVfIavOX2yPh5v6SEu4FdJB92CK5ke',1)
INSERT INTO users(id,first_name,last_name,username,email,password,authority) VALUES (2,'Pedro','Pérez','user','pedro@gmail.com','$2a$12$9x3hBRJuJZalMw8HnvJ7OuqRj3ZGI1NlrLSpN9v4qatz1bNq1rxw2',2)

INSERT INTO types(id,name) VALUES (1,'article')

INSERT INTO papers(id,title,authors,publication_year,type_id,abstract_content,notes,keywords,user_id) VALUES(1,'Title article','Pedro Pérez',2019,1,'An article about science', 'A short article', 'article, science',2)