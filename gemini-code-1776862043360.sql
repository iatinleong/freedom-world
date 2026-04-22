WITH CustomerBase AS (
    -- 步驟 1: 篩選 2025/01 到 2026/03 的新戶，並轉換開戶月份與通路
    SELECT 
        ACCT_NBR,
        -- 將日期轉換為 YYYY-MM 格式 (若您使用的是 SQL Server，可改為 FORMAT(OPEN_DATE, 'yyyy-MM'))
        TO_CHAR(OPEN_DATE, 'YYYY-MM') AS OPEN_MONTH, 
        CASE 
            WHEN OPEN_CHANNEL_CODE = '002' THEN '1.數位'
            WHEN OPEN_CHANNEL_CODE = '001' THEN '2.一般獲客來源'
            ELSE '3.其他/未分類' 
        END AS SOURCE_GROUP
    FROM 
        DS_Sec.M_AC_ACCOUNT
    WHERE 
        -- 涵蓋 2025-01-01 至 2026-03-31
        OPEN_DATE >= DATE '2025-01-01' 
        AND OPEN_DATE < DATE '2026-04-01' 
        -- 【重要】跨月查詢時，請務必鎖定您資料庫中最新的快照日期基準
        AND SNAP_DATE = DATE '2026-03-31' 
)
-- 步驟 2: 依據「開戶年月」與「獲客來源」進行群組與計數
SELECT 
    OPEN_MONTH AS "開戶年月",
    SOURCE_GROUP AS "獲客來源",
    COUNT(DISTINCT ACCT_NBR) AS "新戶人數"
FROM 
    CustomerBase
GROUP BY 
    OPEN_MONTH,
    SOURCE_GROUP
ORDER BY 
    OPEN_MONTH ASC,   -- 先依據月份排序
    SOURCE_GROUP ASC; -- 再依據獲客來源排序