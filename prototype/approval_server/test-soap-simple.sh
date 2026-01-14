#!/bin/bash
# 매우 간단한 SOAP 테스트 (curl만 사용)

HOST=${1:-localhost}
PORT=${2:-8081}

cat << 'EOF' | curl -v -X POST \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: \"\"" \
  -d @- \
  "http://${HOST}:${PORT}/approval-status"
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <processApprovalStatus xmlns="http://www.lgchem.com/ApprovalStatus">
      <API_TYPE>A01</API_TYPE>
      <SYSTEM_ID>BMIL</SYSTEM_ID>
      <APPKEY_01>test-bash-001</APPKEY_01>
      <APPKEY_02></APPKEY_02>
      <APPKEY_03></APPKEY_03>
      <APPKEY_04></APPKEY_04>
      <APPKEY_05></APPKEY_05>
      <APPKEY_06></APPKEY_06>
      <APPROVER>FP508391</APPROVER>
      <COMMENT_UTF8>bash 테스트</COMMENT_UTF8>
      <COMMENT_EUCKR></COMMENT_EUCKR>
      <RESULT>APPROVE</RESULT>
      <NEXT_APPR_TYPE></NEXT_APPR_TYPE>
      <NEXT_APPROVER_ORDER></NEXT_APPROVER_ORDER>
      <NEXT_APPROVER></NEXT_APPROVER>
      <READ_USER></READ_USER>
      <APPR_DATE>20260114150000</APPR_DATE>
    </processApprovalStatus>
  </soap:Body>
</soap:Envelope>
EOF


