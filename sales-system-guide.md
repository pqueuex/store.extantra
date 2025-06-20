# Sales Management System Guide

## ✅ **New Sales System Features**

### 🏷️ **Flexible Sales Criteria**
You can now create sales based on any product specification:
- **Product Type**: `lighter`, `flask`, etc.
- **Color**: `black`, `chrome`, etc.  
- **Category**: `gaming`, `music`, `alternative`, etc.
- **Theme**: `horror`, `fantasy`, `electronic`, `skull`, etc.

### 💰 **Updated Pricing Structure**
- **Original Price**: Base product price
- **Sale Price**: Automatically calculated from percentage
- **Current Price**: What customers actually pay (sale or original)
- **Dynamic Application**: Sales apply automatically when active

### 🎯 **Current Sales Configuration**

**Active Sale:**
- **Black Friday Lighter Sale**: 25% off all black lighters
  - Criteria: `type="lighter"` AND `color="black"`
  - Affects: Aphex Twin, Skyrim Dragon, Need Head Blown Off lighters
  - Result: Prices reduced from $52.99→$39.74, $49.99→$37.49, $41.99→$31.49

**Inactive Sale:**
- **Gaming Collection Sale**: 15% off all gaming themed items
  - Criteria: `category="gaming"`
  - When activated: Would affect Silent Hill 2, Silent Hill 3, Skyrim, Oblivion lighters

## 🛠️ **How to Manage Sales**

### **Access Sales Admin**
1. Navigate to: `http://localhost:8000/sales-admin.html`
2. View all current sales and their status
3. Create new sales or modify existing ones

### **Create New Sales**
1. **Sale Name**: Descriptive name (e.g., "Chrome Lighter Sale")
2. **Description**: Customer-facing description
3. **Discount Percentage**: 1-90% off
4. **Criteria**: Multiple criteria supported:
   - Type + Color: `type="lighter"` AND `color="chrome"`
   - Category only: `category="gaming"`
   - Theme only: `theme="horror"`
   - Multiple criteria: Mix and match any specifications

### **Example Sale Scenarios**

**All Lighters Sale:**
```
Criteria: type="lighter"
Result: Affects ALL lighter products
```

**Chrome Products Sale:**
```
Criteria: color="chrome"  
Result: Affects Silent Hill 2, Silent Hill 3, Oblivion lighters
```

**Gaming + Black Sale:**
```
Criteria: category="gaming" AND color="black"
Result: Affects only Skyrim Dragon lighter
```

**Horror Theme Sale:**
```
Criteria: theme="horror"
Result: Affects Silent Hill 2 and Silent Hill 3 lighters
```

## 🎨 **Visual Sale Indicators**

### **Product Grid (Main Page)**
- **Sale Badge**: Red badge showing "25% OFF" on product images
- **Sale Price**: Large red price showing discounted amount
- **Original Price**: Smaller grey price with strikethrough
- **Add to Cart**: Uses sale price automatically

### **Product Pages**
- **Large Sale Badge**: Prominent percentage off display
- **Sale Price**: Large red current price
- **Original Price**: Strikethrough previous price
- **Purchase Button**: Shows sale price in button text

## 📊 **Current Product Inventory**

### **Black Lighters** (Currently 25% OFF)
1. **Aphex Twin Electronic Zippo** - $52.99 → $39.74
2. **Elder Scrolls Skyrim Dragon Zippo** - $49.99 → $37.49  
3. **Need Head Blown Off Skull Zippo** - $41.99 → $31.49

### **Chrome Lighters** (Regular Price)
1. **Silent Hill 2 Zippo Lighter** - $45.99
2. **Silent Hill 3 Collector Zippo** - $47.99
3. **Elder Scrolls Oblivion Imperial Zippo** - $46.99

## 🔧 **Technical Implementation**

### **Sales Data Structure**
```json
{
  "id": "sale_001",
  "name": "Black Friday Lighter Sale", 
  "description": "25% off all black lighters",
  "active": true,
  "percentage": 25,
  "criteria": {
    "type": "lighter",
    "color": "black"
  },
  "startDate": "2025-06-20",
  "endDate": "2025-12-31"
}
```

### **Product Structure Updates**
- **Removed**: `windproof`, `warranty`, `fuel`, `brand`, `dimensions`
- **Added**: `originalPrice`, `salePrice`, `currentPrice`, `type`, `color`, `theme`
- **Enhanced**: Dynamic pricing calculations and sale application

### **Automatic Sale Application**
- Sales apply automatically when `active: true`
- Multiple sales can be active simultaneously 
- Most beneficial sale applies if conflicts exist
- Cart uses `currentPrice` for all calculations

## 🎯 **Business Use Cases**

### **Seasonal Sales**
- **Black Friday**: All products 20% off
- **Gaming Week**: Gaming category 15% off
- **Color Promotions**: Specific colors on sale

### **Inventory Management**
- **Overstock**: Put specific colors/themes on sale
- **New Product Launch**: Discount older items
- **Theme Promotions**: Horror month, fantasy week, etc.

### **Marketing Campaigns**
- **Social Media**: "All black lighters 25% off this week!"
- **Email**: "Chrome collection sale - 20% off"
- **Targeted**: Gaming enthusiasts get gaming category discounts

## 🚀 **Next Steps**

1. **Test Current Sale**: View black lighters with 25% discount
2. **Create New Sales**: Use admin panel to create additional sales
3. **Activate/Deactivate**: Toggle sales on and off as needed
4. **Monitor Performance**: Track which sales drive the most conversions
5. **Expand Inventory**: Add flasks and other product types
6. **Advanced Criteria**: Create more complex sale rules

The sales system now provides complete flexibility to run any type of promotion based on product specifications, with automatic price calculations and professional visual presentation.
