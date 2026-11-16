INSERT INTO lab_members VALUES (1,'An',20),(2,'Anh',25),(3,'Binh',30),(4,'Cuong',18);
INSERT INTO products VALUES
  (1,'Mouse',100,'BLACK','ACTIVE'), (2,'Keyboard',200,'WHITE','ACTIVE'),
  (3,'Laptop',300,'BLACK','ACTIVE'), (4,'Laptop Stand',200,'BLACK','INACTIVE'),
  (5,'Monitor',400,'WHITE','ACTIVE'), (6,'Cable',100,'WHITE','ACTIVE');
INSERT INTO lab_groups (id, name, creator, created_at) VALUES
  (1,'Backend','admin',TIMESTAMP WITH TIME ZONE '2025-02-07 08:00:00+00:00'),
  (2,'Ops','admin',TIMESTAMP WITH TIME ZONE '2025-02-07 08:00:00+00:00'),
  (3,'Empty','admin',TIMESTAMP WITH TIME ZONE '2025-02-07 08:00:00+00:00');
INSERT INTO lab_accounts (id, username, email) VALUES (1,'an','an@example.test'),(2,'linh','linh@example.test');
INSERT INTO lab_membership VALUES (1,1),(2,1),(2,2);
