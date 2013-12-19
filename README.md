Social-Viz
==========

REQUIREMENTS
------------
Code run on Ubuntu 11.10

Requirements: 
- MySQL for storing tweets data to generate JSON files
- node.js with jsdom to create svg files
- ffmpeg for creating video files


OUTPUT
------

- JSON Output is present in the folder Resources -> jsonOutput.
  jsonOutput in turn has two folders - Cooccurence and Cumulative.
  Coocurrence folder has the coocurence count for each day as a json file. 
  Cumulative folder has the cumulative-coocurence count for each day as a json file.

- SVG output is present in the folder Resources -> svg

- PNG output is present in the folder Resources -> png

- Video files are present in the folder Resources -> video

  
DATA STATISTICS
---------------
- The data is for around 10 million tweets

- The tweets data has 102 dates. 
  This includes: March 1 to March 31, 2013 ;
                 April 1 to April 12, 2013 ;
                 April 24 to April 30, 2013 ;
                 May 1 to May 31, 2013 ;
                 June 1 to June 21, 2013 .

NOTE: The tweets for the period April 13 to April 23, 2013 are missing.

DATA
----

- The original data was first split into 20 files using a csv splitter application.
- This data required cleaning as the data format was not compatible with MySQL. 
  Google Refine was used for this purpose. 
  The GREL expression :
  value.replace(/+\d{4}/," ").substring(value.indexOf(" ")).split("").join(" ").toDate().toString("yyyy-MM-dd")  
  was used to transform the cells in the column 'created_at'. 
  The result of this transformation was exported as a csv file. 
- The csv files were then loaded in MySQL.
  SCHEMA NAME: health_data
  TABLE NAME: health_tweets
  See file generateCooccurence.java for functions communicating with DB.
  The SQL commands CREATE and LOAD DATA for the same are present in Resources->dr_sql.sql.
