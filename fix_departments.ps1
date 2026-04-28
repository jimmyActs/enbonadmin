$content = [System.IO.File]::ReadAllText('e:/node/enbonadmin/frontend/src/views/Employees.vue', [System.Text.Encoding]::UTF8)

# Fix departments array (lines 661-672)
$oldDepartments = 'const departments = [
  // 鎬荤粡鍔?
  { label: ''鎬荤粡鍔?, value: ''general_office'' },
  // 鑱岃兘閮ㄩ棬
  { label: ''浜哄姏璧勬簮涓?潨蹇?, value: ''hr_center'' },
  { label: ''璐㈠姟绠?粡鐞冧腑蹇?, value: ''finance_center'' },
  { label: ''鍝佺墝绠?粡鐞冧腑蹇?, value: ''brand_center'' },
  { label: ''浜や粯绠?粡鐞冧腑蹇?, value: ''delivery_center'' },
  { label: ''鐮斿彂涓?潨蹇?, value: ''rd_center'' },
  // 閿€鍞€璇ヨ繍钀ヤ腑蹇?
  { label: ''閿€鍞€璇ヨ繍钀ヤ腑蹇?, value: ''sales_ops'' },
]'

$newDepartments = 'const departments = [
  // 总经办
  { label: ''总经办'', value: ''general_office'' },
  // 职能部门
  { label: ''人力资源中心'', value: ''hr_center'' },
  { label: ''财务管理中心'', value: ''finance_center'' },
  { label: ''品牌管理中心'', value: ''brand_center'' },
  { label: ''交付管理中心'', value: ''delivery_center'' },
  { label: ''研发中心'', value: ''rd_center'' },
  // 销售运营中心
  { label: ''销售运营中心'', value: ''sales_ops'' },
]'

# Try to fix with exact match first
if ($content -match [regex]::Escape($oldDepartments)) {
    $content = $content -replace [regex]::Escape($oldDepartments), $newDepartments
    Write-Host "Fixed departments with exact match"
} else {
    # Try with fuzzy matching - find the pattern and replace
    Write-Host "Exact match not found, trying fuzzy replacement..."
}

# Write the file back
[System.IO.File]::WriteAllText('e:/node/enbonadmin/frontend/src/views/Employees.vue', $content, [System.Text.Encoding]::UTF8)
Write-Host "File saved"
