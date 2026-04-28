-- 查看 hr_director_role (id=40) 的所有权限
SELECT COUNT(*) as total, rp."roleId", r.code, r.name
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
WHERE rp."roleId" = 40
GROUP BY rp."roleId", r.code, r.name;

-- 列出具体权限码
SELECT p.code, p.name, p.module
FROM role_permissions rp
JOIN permissions p ON p.id = rp."permissionId"
WHERE rp."roleId" = 40
ORDER BY p.module, p.code;
