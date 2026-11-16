INSERT INTO product_offerings (id, name, price, color)
SELECT 1, 'Product A', 100000, 'red'
WHERE NOT EXISTS (SELECT 1 FROM product_offerings WHERE id = 1);
