-- 查看所有用户及其关联的角色
SELECT u.id, u.username, u.email, r.code as role_code, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON ur."userId" = u.id
LEFT JOIN roles r ON r.id = ur."roleId"
ORDER BY u.id;
