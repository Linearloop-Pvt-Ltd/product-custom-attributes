<h1 align="center">Product Custom Attributes</h1>

<p>This plugin provides the ability to manage custom attributes at the <strong>category level</strong>, with the option to <strong>sync those attributes to products</strong> within the category. You can then assign and manage values for each attribute at the product level. Additionally, the plugin allows you to configure the <strong>visibility of attributes on the storefront</strong>, ensuring that only the relevant information is displayed to customers.
</strong></p>

<br />

## Previews
<div style="display:flex; overflow-x: auto; gap: 10px; scroll-snap-type: x mandatory;">
  <img src="https://linearcommerce.s3.us-east-1.amazonaws.com/assest/custom_attribute.png" width="300" style="scroll-snap-align: start;" />
  <img src="https://linearcommerce.s3.us-east-1.amazonaws.com/assest/two_brand.png" width="300" style="scroll-snap-align: start;" />
</div>

## Dependencies
**To use this plugin, you must have installed the following npm packages dependencies**

**Install aws-sdk/client-s3 and aws-sdk/s3-presigned-post** 

```
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-presigned-post

```
**Install react-dropzone** 

```
npm install --save react-dropzone


## Installation

```
yarn add @linearcommerce/product-custom-attributes

-- OR -- 

npm i @linearcommerce/product-custom-attributes
```

## Compatibility

**To use this plugin, you need to have the minimum versions of the following dependencies:**

```json
"@medusajs/admin-sdk": "^2.8.2",
"@medusajs/cli": "^2.8.2",
"@medusajs/framework": "^2.8.2",
"@medusajs/icons": "^2.8.2",
"@medusajs/js-sdk": "^2.8.2",
"@medusajs/medusa": "^2.8.2",
```

## Usage

#### Add below environment variables in your .env file If you are using AWS S3 for file uploads:

```ts
AWS_S3_ACCESS_KEY_ID=Your AWS Access Key ID
AWS_S3_ACCESS_SECRET=Your AWS Access Secret Key
AWS_S3_REGION=Your AWS Region
AWS_S3_BUCKET=Your AWS Bucket Name
AWS_S3_ENDPOINT=https://s3.amazonaws.com
```



#### Add the plugin to your `medusa-config.ts` file:

```ts
plugins: [
  {
    resolve: '@linearcommerce/product-custom-attributes',
    options: {},
  },
],
```

#### Run the database migrations (Adds a table to your database for storing custom attributes):

```
npx medusa db:migrate
```


## Key Features:

- Define and manage custom attributes at the category level.  
- Automatically sync category attributes to associated products and manage their values seamlessly.  
- Leverage a flexible structure that supports diverse use cases, including product specifications, category-specific filters, and additional descriptive fields.  

This plugin is particularly valuable for stores that need functionality beyond Medusa’s default product and category fields. It empowers you to extend and customize your catalog, ensuring it aligns with your unique business requirements.

