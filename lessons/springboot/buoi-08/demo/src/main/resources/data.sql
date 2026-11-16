INSERT INTO app_users VALUES (1, 'an', 'An', 'Nguyen', 24), (2, 'binh', 'Binh', 'Tran', 29);
INSERT INTO app_groups VALUES (1, 'Backend'), (2, 'QA');
INSERT INTO user_groups (user_id, group_id) VALUES (1, 1), (1, 2);
