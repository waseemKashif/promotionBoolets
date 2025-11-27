const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// SQL Server connection configuration
const { mysqlConfig, mysqlConfigAG } = require('./../dbConfig');
const dbPool = mysql.createPool(mysqlConfig);
//const serverPool = mysql.createPool(serverConfig);
// Function to execute queries
async function query(connection, sql, params) {
    try {
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (err) {
      throw err;
    }
}


//qi.location = 'Q013' AND
async function processProducts() {
    try {
       console.log(`Start: Product Export Price/Stock.`);
      //const { stockCsvFile, priceCsvFile } = createCsvFiles();
      const excludeStockProduct=['011','012','013']; // exclude product stock and price item list 
      const currentDate = `${new Date().toISOString().replace(/:/g, '-')}`;      
      const file_name=`${currentDate}-Q013-stock-express-ahmarket.csv`;
      const file_name_price=`${currentDate}-Q021-price-express-ahmarket.csv`;
      const localFilePath1 = path.join(__dirname, 'ahmarket', file_name);
      const localFilePath2 = path.join(__dirname, 'ahmarket', file_name_price);
      const stockCsvFile = fs.createWriteStream(localFilePath1);
      const priceCsvFile = fs.createWriteStream(localFilePath2);
      stockCsvFile.write('source_code,sku,status,qty\n');
      priceCsvFile.write('sku,price\n');
      const products = await query(dbPool, `SELECT 
      e.sku, 
      e.dtype,
      qi.group_code,
      qi.location,
      qi.location_stock - COALESCE(e.threshold_qty, 0) AS location_stock,
      qi.standard_price,
      IF(qp.sku IS NULL, 0, 1) AS checkPromotion,
      e.uom AS euom,
      e.weight
    FROM 
      qa_sku_delivery_type_id e
    LEFT JOIN 
      erp_db qi ON e.sku = qi.sku
    LEFT JOIN 
      ansar_group_qatar_promotional_items qp ON e.sku = qp.sku
    WHERE 
       qi.sales_code = 'Q021' AND qi.group_code NOT IN ('011','012','013')
      AND qi.type IN (4,5,6) 
      AND (
        (e.dtype IN ('exp', 'nol') AND qi.location IN ('Q013', 'Q011'))
        OR (qp.sku IS NOT NULL)
      )`);
      let ml=0;
      //5 type for both website and temp database
        if (Array.isArray(products)) {
          
            for (const product of products) {
                const { sku, dtype, group_code, location, location_stock, standard_price, checkPromotion, euom, weight } = product;
              if (sku) { 
                if (!checkPromotion && standard_price>0) {
                    let price;
                      //@euom - this is used to check website unit of measurement of this sku
                      switch (true) {
                          case (weight > 0  && euom === 'GRAMS' && euom !== null):
                              // Case when euom is '1365' and quantity per UOM is different from weight
                              price = (weight * standard_price) / 1000;
                              break;
                        case (weight > 0  && euom === 'KG' && euom !== null):
                              // Case when euom is '1365' and quantity per UOM is different from weight
                              price = (weight * standard_price);
                              break;
                          case (weight > 0  && euom !== null):
                              // Case when qty_per_uom matches weight and euom is not null
                              price = weight*standard_price;
                              break;
                          default:
                              // Default case when no specific conditions match
                              price = standard_price; // Adjust if you have a default calculation
                              break;
                      }
                    
                    priceCsvFile.write(`${sku},${price}\n`);
                    //await query(serverPool, "UPDATE ahqa_catalog_product_entity_decimal SET value = ? WHERE attribute_id = (SELECT attribute_id FROM ahqa_eav_attribute WHERE attribute_code = 'price') AND entity_id = (SELECT entity_id FROM ahqa_catalog_product_entity WHERE sku = ?)", [parseFloat(standard_price), sku]);
                }
                
                let new_quantity = Math.max(0, parseInt(location_stock, 10) || 0);
                const sourceStock='default';
                
                //@euom - this is used to check website unit of measurement of this sku
                  switch (true) {
                      case (new_quantity > 0  && euom === 'SQMETER' && euom !== null):
                          // Case when euom is '1365' and quantity per UOM is different from weight
                          new_quantity = (new_quantity/weight);
                          new_quantity = Math.max(0, new_quantity);
                          break;
                      default:
                          // Default case when no specific conditions match
                          new_quantity = Math.max(0, new_quantity);
                          break;
                  } 
                const statusInstock=(new_quantity>0)? 1:0;
                stockCsvFile.write(`${sourceStock},${sku},${statusInstock},${new_quantity}\n`);
               
                ml++;
              }else{
                console.log(`No Record : Product Export Price/Stock .==> ${sku}`);
              }          
            }
        }
        stockCsvFile.end();
        priceCsvFile.end();
        console.log(`Success: Product Export Express Price/Stock Done.`+ml);
        // const remoteFilePathl= `/home/ahmarket/public_html/dataEntry/stock-price/${file_name}`;
        // const remoteFilePathlPrice= `/home/ahmarket/public_html/dataEntry/stock-price/${file_name_price}`;
        // Upload the files
        //await uploadToFtp(localFilePath1, remoteFilePathl);
        //await uploadToFtp(localFilePath2, remoteFilePathlPrice);
    } catch (err) {
      console.error('Error occurred:', err);
    }
  }

processProducts()
  .then(() => {
    console.log('Processing complete');
    dbPool.end();
    //serverPool.end();
  })
  .catch((err) => {
    console.error('Error occurred:', err);
    dbPool.end();
    //serverPool.end();
  });