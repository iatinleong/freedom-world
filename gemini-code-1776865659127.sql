WITH CustomerBase AS (
    -- 步驟 1: 撈出目標區間的新戶底表
    SELECT 
        ACCT_NBR,
        OPEN_DATE,
        TO_CHAR(OPEN_DATE, 'YYYY-MM') AS OPEN_MONTH, 
        CASE 
            WHEN OPEN_CHANNEL_CODE = '002' THEN '1.數位'
            ELSE '2.一般獲客來源' 
        END AS SOURCE_GROUP
    FROM 
        DS_Sec.M_AC_ACCOUNT
    WHERE 
        OPEN_DATE >= TO_DATE('2025-01-01', 'YYYY-MM-DD') 
        AND OPEN_DATE < TO_DATE('2026-04-01', 'YYYY-MM-DD') 
        AND SNAP_DATE = TO_DATE('2026-03-31', 'YYYY-MM-DD') 
)
-- 步驟 2: 計算實動人數 (使用 EXISTS 短路掃描)
SELECT 
    c.OPEN_MONTH AS "開戶年月",
    c.SOURCE_GROUP AS "獲客來源",
    COUNT(c.ACCT_NBR) AS "新戶人數",
    SUM(
        CASE WHEN 
            -- 💡 專家效能秘訣：把交易量最大的「股票」、「基金」擺在最前面！
            -- 只要符合第一個 EXISTS，後面的表就不會執行掃描，極大化節省效能。

            -- 1. 股票交易 (通常為 TRADE_DATE)
            EXISTS (SELECT 1 FROM DS_Sec.M_AT_STOCK_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TRADE_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TRADE_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 2. 基金交易 (通常為 TXN_DATE)
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_FUND_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 3. 期貨交易 (通常為 TXN_DATE)
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_FUTURE_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 4. 複委託/投資委託 (通常為 ORD_DATE)
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_INVESTMENT_ORD t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.ORD_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.ORD_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 5. 債券交易
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_BOND_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 6. 借券交易
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_BSBL_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 7. 借貸交易
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_LOAN_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 8. 結構型商品
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_SN_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 9. 壽險舉績
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_INSURANCE_TXN t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.TXN_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.TXN_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
            -- 10. 配息明細 (⚠️ M_AT_DIV 的特殊處理)
            OR EXISTS (SELECT 1 FROM DS_Sec.M_AT_DIV t WHERE t.ACCT_NBR = c.ACCT_NBR AND t.PAY_DATE >= TRUNC(c.OPEN_DATE, 'MM') AND t.PAY_DATE < ADD_MONTHS(TRUNC(c.OPEN_DATE, 'MM'), 6))
            
        THEN 1 ELSE 0 END
    ) AS "獲客後半年之啟用人數"
FROM 
    CustomerBase c
GROUP BY 
    c.OPEN_MONTH,
    c.SOURCE_GROUP
ORDER BY 
    c.OPEN_MONTH ASC,
    c.SOURCE_GROUP ASC;