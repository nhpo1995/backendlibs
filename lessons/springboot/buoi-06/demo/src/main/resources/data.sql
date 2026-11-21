INSERT INTO product_offerings (id, name, price, color, status) VALUES
    (1, 'Product A', 100000, 'red', 'ACTIVE'),
    (2, 'Product B', 150000, 'blue', 'INACTIVE');

INSERT INTO product_details (id, brand, power) VALUES
    (1, 'Example', '45 W'),
    (2, 'Example', '65 W'),
    (3, 'Example', '90 W');

INSERT INTO single_detail (id, specification) VALUES (10, '65 W');
INSERT INTO single_offering (id, name, detail_id) VALUES
    (1, 'Adapter', 10),
    (2, 'Cable', NULL);

INSERT INTO product_offering_detail (product_offering_id, product_detail_id) VALUES
    (1, 1), (1, 2), (2, 2);
