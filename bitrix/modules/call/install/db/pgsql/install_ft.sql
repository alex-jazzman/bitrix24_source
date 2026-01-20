CREATE INDEX tx_b_call_userlog_index_search_content ON b_call_userlog_index USING GIN (to_tsvector('english', search_content));
CREATE INDEX tx_b_call_userlog_index_search_title ON b_call_userlog_index USING GIN (to_tsvector('english', search_title));
