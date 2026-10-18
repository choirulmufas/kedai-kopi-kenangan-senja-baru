<?php

require_once __DIR__ . '/midtrans-php-master/midtrans-php-master/Midtrans.php';

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method tidak diizinkan.');
}

// Set your Merchant Server Key
$serverKey = getenv('MIDTRANS_SERVER_KEY') ?: ($_SERVER['MIDTRANS_SERVER_KEY'] ?? '');
if (!$serverKey) {
    http_response_code(500);
    exit('MIDTRANS_SERVER_KEY belum dikonfigurasi.');
}
\Midtrans\Config::$serverKey = $serverKey;
// Set to Development/Sandbox Environment (default). Set to true for Production Environment (accept real transaction).
\Midtrans\Config::$isProduction = false;
// Set sanitization on (default)
\Midtrans\Config::$isSanitized = true;
// Set 3DS transaction for credit card to true
\Midtrans\Config::$is3ds = true;

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$requestedItems = json_decode($_POST['items'] ?? '', true);

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $phone === '' || !is_array($requestedItems)) {
    http_response_code(422);
    exit('Data checkout tidak valid.');
}

$catalog = [
    1 => ['name' => 'Robusta Brazil', 'price' => 20000],
    2 => ['name' => 'Arabica Blend', 'price' => 25000],
    3 => ['name' => 'Primo Passo', 'price' => 30000],
    4 => ['name' => 'Aceh Gayo', 'price' => 35000],
    5 => ['name' => 'Sumatra Mandheling', 'price' => 40000],
];

$items = [];
$grossAmount = 0;
foreach ($requestedItems as $requestedItem) {
    $id = filter_var($requestedItem['id'] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($requestedItem['quantity'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $quantity === false || $quantity < 1 || $quantity > 100 || !isset($catalog[$id])) {
        http_response_code(422);
        exit('Item pesanan tidak valid.');
    }

    $product = $catalog[$id];
    $items[] = [
        'id' => (string) $id,
        'name' => $product['name'],
        'price' => $product['price'],
        'quantity' => $quantity,
    ];
    $grossAmount += $product['price'] * $quantity;
}

if ($grossAmount < 1) {
    http_response_code(422);
    exit('Keranjang belanja kosong.');
}

$params = [
    'callbacks' => [
        'finish' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
            . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
            . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/',
    ],
    'transaction_details' => [
        'order_id' => 'KKS-' . date('YmdHis') . '-' . bin2hex(random_bytes(4)),
        'gross_amount' => $grossAmount,
    ],
    'item_details' => $items,
    'customer_details' => [
        'first_name' => $name,
        'email' => $email,
        'phone' => $phone,
    ],
];

try {
    echo \Midtrans\Snap::getSnapToken($params);
} catch (Throwable $error) {
    error_log('Midtrans checkout error: ' . $error->getMessage());
    http_response_code(502);
    exit('Gagal membuat transaksi sandbox: ' . $error->getMessage());
}
