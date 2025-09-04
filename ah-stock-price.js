const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
 host: '200.69.24.87',
    user: 'webdevel_ansarpro',
    password: 'mPjIcJV^sIyN',
    database: 'webdevel_dataentry'
};


const dbPool = mysql.createPool(dbConfig);
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


// qi.location = 'Q013' AND
async function processProducts() {
    try {
       console.log(`Start: Product Export Price/Stock.`);
      //const { stockCsvFile, priceCsvFile } = createCsvFiles();
      const currentDate = `${new Date().toISOString().replace(/:/g, '-')}`; 
      const file_name=`${currentDate}-Q013-stock-ahmarket.csv`;
      const file_name_price=`${currentDate}-Q021-price-ahmarket.csv`;
      const localFilePath1 = path.join(__dirname, 'ahmarket', file_name);
      const localFilePath2 = path.join(__dirname, 'ahmarket', file_name_price);
      const stockCsvFile = fs.createWriteStream(localFilePath1);
      const priceCsvFile = fs.createWriteStream(localFilePath2);
      //stockCsvFile.write('sku,qty\n');
      stockCsvFile.write('source_code,sku,status,qty\n');
      priceCsvFile.write('sku,price\n');
      const products = await query(dbPool, `SELECT 
      e.sku, 
      e.dtype,
      qi.location,
      qi.location_stock - COALESCE(e.threshold_qty, 0) AS location_stock,
      qi.total_stock - COALESCE(e.threshold_qty, 0) AS total_stock,
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
    WHERE  qi.sales_code = 'Q021' 
      AND qi.type IN (4,5,6) AND e.dtype!='exp' `);
      let ml=0;
        if (Array.isArray(products)) {
          
            for (const product of products) {
                const { sku, location_stock, total_stock, location, standard_price,dtype, checkPromotion,weight,euom } = product;
              if (sku) { 
                if (!checkPromotion && standard_price>0) {
                    let price;
                      //@euom - this is used to check website unit of measurement of this sku
                      switch (true) {
                          case (weight > 0  && euom === 'GRAMS'):
                              // Case when euom is '1365' and quantity per UOM is different from weight
                              price = (weight * standard_price) / 1000;
                              break;
                         case (weight > 0  && euom === 'KG'):
                              // Case when euom is '1365' and quantity per UOM is different from weight
                              price = (weight * standard_price);
                             
                              break;
                        case (weight > 0  && euom === 'SQMETER'):
                              // Case when euom is '1365' and quantity per UOM is different from weight
                              price = (weight * standard_price);
                              //console.log(`${sku},${standard_price},${weight},${price}`)
                              
                              break;
                        case (weight > 0  && euom !== null):
                              // Case when qty_per_uom matches weight and euom is not null
                              price = (weight*standard_price);
                              break;
    
                          default:
                              // Default case when no specific conditions match
                              price = standard_price; // Adjust if you have a default calculation
                              break;
                      }
                      //console.log(`${sku},${standard_price},${weight},${price}`)
                    priceCsvFile.write(`${sku},${price}\n`);
                  }                 
                let new_quantity;
                if (dtype === 'sup') {
                  new_quantity = 200;
                } 
                // else if (dtype === 0 || dtype === '0') {
                //   new_quantity = 0;
                // } 
                else {
                  const stock = (dtype === 'exp') ? parseInt(location_stock) : parseInt(total_stock);
                  new_quantity = Math.max(0, stock);
                  //@euom - this is used to check website unit of measurement of this sku
                  switch (true) {
                      case (stock > 0  && euom === 'SQMETER' && euom !== null):
                          // Case when euom is '1365' and quantity per UOM is different from weight
                          new_quantity = (stock/weight);
                          new_quantity = Math.max(0, new_quantity);
                          break;
                      default:
                          // Default case when no specific conditions match
                          new_quantity = Math.max(0, new_quantity);
                          break;
                  }         
                }
                const statusInstock=(new_quantity>0)? 1:0;
                const sourceStock='default';
                stockCsvFile.write(`${sourceStock},${sku},${statusInstock},${new_quantity}\n`);
                // Update stock
                //const is_in_stock = new_quantity > 0 ? 1 : 0;
                //await query(serverPool, "UPDATE ahqa_cataloginventory_stock_item SET is_in_stock = ?, qty = ? WHERE product_id = (SELECT entity_id FROM ahqa_catalog_product_entity WHERE sku = ?)", [is_in_stock, new_quantity, sku]);
                //Update source item
                //await query(serverPool, "UPDATE ahqa_inventory_source_item SET source_code = ?, status = ?, quantity = ? WHERE sku = ?", ['default', is_in_stock, new_quantity, sku]);
                ml++;
              }else{
                console.log(`No Record : Product Export AH Price/Stock .==> ${sku}`);
              }
          
            }
        }
        stockCsvFile.end();
        priceCsvFile.end();
       
        console.log(`Success: Product Export Price/Stock Done.`+ml);
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