document.addEventListener("alpine:init", () => {
  Alpine.data("products", () => ({
    items: [
      { id: 1, name: "Robusta Brazil", img: "1.jpg", price: 20000, description: "Rasa kuat dengan sentuhan cokelat yang cocok untuk teman memulai hari." },
      { id: 2, name: "Arabica Blend", img: "2.jpg", price: 25000, description: "Perpaduan aroma lembut dan rasa seimbang untuk dinikmati perlahan." },
      { id: 3, name: "Primo Passo", img: "3.jpg", price: 30000, description: "Karakter manis dan aroma harum untuk momen santai di sore hari." },
      { id: 4, name: "Aceh Gayo", img: "4.jpg", price: 35000, description: "Cita rasa kaya dengan sedikit nuansa rempah khas dataran tinggi." },
      { id: 5, name: "Sumatra Mandheling", img: "5.jpg", price: 40000, description: "Body tebal dan rasa earthy yang meninggalkan akhir cerita panjang." },
    ],
  }));

  Alpine.store("cart", {
    items: [],
    total: 0,
    quantity: 0,
    add(newItem) {
      // cek apakah ada barang sama di cart
      const cartItem = this.items.find((item) => item.id === newItem.id);

      // jika belum ada / cart masih kosong
      if (!cartItem) {
        this.items.push({ ...newItem, quantity: 1, total: newItem.price });
        this.quantity++;
        this.total += newItem.price;
      } else {
        // jika barang sudah ada, cek apakah barang beda atau sama dengan yang ada di cart
        this.items = this.items.map((item) => {
          if (item.id !== newItem.id) {
            return item;
          } else {
            // jika barang sudah ada, tambah quantity dan totalnya
            item.quantity++;
            item.total = item.price * item.quantity;
            this.quantity++;
            this.total += item.price;
            return item;
          }
        });
      }
    },
    remove(id) {
      // ambil item yang mau di remove berdasarkan id nya
      const cartItem = this.items.find((item) => item.id === id);

      // jika item lebih dari 1
      if (!cartItem) {
        return;
      }

      if (cartItem.quantity > 1) {
        // telusuri 1 1
        this.items = this.items.map((item) => {
          // jika bukan barang yang di klik
          if (item.id !== id) {
            return item;
          } else {
            item.quantity--;
            item.total = item.price * item.quantity;
            this.quantity--;
            this.total -= item.price;
            return item;
          }
        });
      } else {
        // jika barangnya sisa 1
        this.items = this.items.filter((item) => item.id !== id);
        this.quantity--;
        this.total -= cartItem.price;
      }
    },
  });
});

// Form Validation
document.addEventListener("alpine:initialized", () => {
const checkoutButton = document.querySelector(".checkout-button");
const form = document.querySelector("#checkoutForm");
const updateCheckoutButton = () => {
  const cart = Alpine.store("cart");
  const valid = form.checkValidity() && Boolean(cart && cart.items.length);
  checkoutButton.disabled = !valid;
  checkoutButton.classList.toggle("disabled", !valid);
};

updateCheckoutButton();
form.addEventListener("input", updateCheckoutButton);

// kirim data ketika tombol checkout diklik
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const cart = Alpine.store("cart");
  if (!form.checkValidity() || !cart || cart.items.length === 0) {
    form.reportValidity();
    return;
  }

  checkoutButton.disabled = true;
  checkoutButton.textContent = "Memproses...";
  const formData = new FormData(form);
  const data = new URLSearchParams(formData);

  // minta transaction token menggunakan ajax / fetch
  try {
    const response = await fetch('php/placeOrder.php', {
      method: 'POST',
      body: data,
    });
    const token = await response.text();
    if (!response.ok) {
      throw new Error(token || `Gagal membuat transaksi (HTTP ${response.status}).`);
    }
    if (!window.snap) {
      throw new Error("Midtrans Snap belum termuat. Periksa koneksi atau script sandbox.");
    }
    window.snap.pay(token, {
      onSuccess: () => {
        window.location.href = `${window.location.pathname}?payment=success`;
      },
      onPending: () => {
        window.location.href = `${window.location.pathname}?payment=pending`;
      },
      onError: () => {
        alert("Pembayaran gagal diproses.");
      },
      onClose: () => {
        checkoutButton.disabled = false;
        checkoutButton.textContent = "Bayar dengan Midtrans";
      },
    });
  } catch (err) {
    console.log(err.message);
    alert(err.message);
  } finally {
    updateCheckoutButton();
    checkoutButton.textContent = "Bayar dengan Midtrans";
  }
});
});

// format pesan whatsapp
const formatMessage = (obj) => {
  return `Data Customer
    Nama : ${obj.name}
    Email : ${obj.email}
    No HP: ${obj.phone}
    Data Pesanan
    ${JSON.parse(obj.items).map((item) => `${item.name} (${item.quantity} x ${rupiah(item.total)}) \n`)}
    TOTAL: ${rupiah(obj.total)}
    Terima kasih.`;
};
// konversi ke Rupiah
const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};
