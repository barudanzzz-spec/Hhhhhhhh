"""DANZ STORE V5 - Full Marketplace Backend
Game account marketplace with auth, listings, orders, payments, admin, moderation.
"""
import os
import uuid
import logging
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional, Literal, Any

import bcrypt
import jwt as pyjwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "danzxcynx@gmail.com").lower()
ADMIN_INITIAL_PASSWORD = os.environ.get("ADMIN_INITIAL_PASSWORD", "DanzAdmin2026!")
JWT_ALG = "HS256"
ACCESS_HOURS = 24

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="DANZ STORE V5 API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("danz")


# ---------------- Helpers ----------------
def now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    raw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], stored.encode())
    except Exception:
        return False


def make_token(user_id: str, role: str) -> str:
    return pyjwt.encode(
        {
            "sub": user_id,
            "role": role,
            "iat": now(),
            "exp": now() + timedelta(hours=ACCESS_HOURS),
        },
        JWT_SECRET,
        algorithm=JWT_ALG,
    )


def strip_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


async def get_current_user(c: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not c:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(c.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u or u.get("disabled"):
        raise HTTPException(401, "Invalid session")
    return u


async def require_admin(u: dict = Depends(get_current_user)) -> dict:
    if u.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return u


# ---------------- Models ----------------
class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    display_name: str = Field(min_length=1, max_length=60)


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=72)


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    category_id: str
    price: float = Field(gt=0)
    description: str = Field(min_length=10, max_length=4000)
    images: List[str] = Field(default_factory=list)
    item_info: Optional[str] = None


class ListingModerate(BaseModel):
    action: Literal["approve", "reject"]
    reason: Optional[str] = None


class OrderCreate(BaseModel):
    listing_id: str
    payment_method_id: str


class OrderPay(BaseModel):
    proof_url: Optional[str] = None
    note: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class PaymentMethodReq(BaseModel):
    name: str
    type: Literal["ewallet", "bank", "qris"]
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    instructions: Optional[str] = None
    qris_image_url: Optional[str] = None
    enabled: bool = True
    sort_order: int = 0


class SiteSettings(BaseModel):
    store_name: Optional[str] = None
    tagline: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    contact_email: Optional[str] = None
    announcement: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    maintenance_message: Optional[str] = None


# ---------------- Auth routes ----------------
@api.post("/auth/register")
async def register(body: RegisterReq):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email sudah terdaftar")
    user = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name,
        "role": "user",
        "disabled": False,
        "must_change_password": False,
        "avatar_url": None,
        "created_at": now().isoformat(),
    }
    await db.users.insert_one(user)
    token = make_token(user["id"], user["role"])
    return {"access_token": token, "user": strip_id(user)}


@api.post("/auth/login")
async def login(body: LoginReq):
    email = body.email.lower()
    u = await db.users.find_one({"email": email})
    if not u or not verify_password(body.password, u.get("password_hash", "")):
        raise HTTPException(401, "Email atau password salah")
    if u.get("disabled"):
        raise HTTPException(403, "Akun dinonaktifkan")
    token = make_token(u["id"], u["role"])
    return {"access_token": token, "user": strip_id(dict(u))}


@api.get("/auth/me")
async def me(u: dict = Depends(get_current_user)):
    return strip_id(dict(u))


@api.post("/auth/change-password")
async def change_password(body: ChangePasswordReq, u: dict = Depends(get_current_user)):
    if not verify_password(body.current_password, u.get("password_hash", "")):
        # fetch fresh since current user strip removed hash
        full = await db.users.find_one({"id": u["id"]})
        if not full or not verify_password(body.current_password, full.get("password_hash", "")):
            raise HTTPException(400, "Password saat ini salah")
    await db.users.update_one(
        {"id": u["id"]},
        {"$set": {"password_hash": hash_password(body.new_password), "must_change_password": False}},
    )
    return {"ok": True}


# ---------------- Categories ----------------
@api.get("/categories")
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return cats


@api.post("/categories")
async def create_category(payload: dict, admin: dict = Depends(require_admin)):
    cat = {
        "id": new_id(),
        "name": payload.get("name", "Untitled"),
        "slug": payload.get("slug", payload.get("name", "untitled").lower().replace(" ", "-")),
        "icon_url": payload.get("icon_url"),
        "sort_order": payload.get("sort_order", 99),
    }
    await db.categories.insert_one(cat)
    return strip_id(cat)


@api.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, admin: dict = Depends(require_admin)):
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


# ---------------- Listings ----------------
@api.get("/listings")
async def list_listings(
    q: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "newest",
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
):
    query: dict = {"status": status_filter or "approved", "availability": {"$ne": "sold"}}
    if status_filter == "all":
        query.pop("status", None)
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    if category_id:
        query["category_id"] = category_id
    price_q: dict = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        query["price"] = price_q
    sort_map = {"newest": [("created_at", -1)], "price_asc": [("price", 1)], "price_desc": [("price", -1)]}
    cursor = db.listings.find(query, {"_id": 0}).sort(sort_map.get(sort, sort_map["newest"])).skip(skip).limit(limit)
    return await cursor.to_list(limit)


@api.get("/listings/mine")
async def my_listings(u: dict = Depends(get_current_user)):
    cursor = db.listings.find({"seller_id": u["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/listings/pending")
async def pending_listings(admin: dict = Depends(require_admin)):
    cursor = db.listings.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    l = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not l:
        raise HTTPException(404, "Listing tidak ditemukan")
    seller = await db.users.find_one({"id": l.get("seller_id")}, {"_id": 0, "password_hash": 0, "email": 0})
    l["seller"] = {"id": seller["id"], "display_name": seller["display_name"], "avatar_url": seller.get("avatar_url")} if seller else None
    return l


@api.post("/listings")
async def create_listing(body: ListingCreate, u: dict = Depends(get_current_user)):
    cat = await db.categories.find_one({"id": body.category_id})
    if not cat:
        raise HTTPException(400, "Kategori tidak valid")
    listing = {
        "id": new_id(),
        "title": body.title,
        "category_id": body.category_id,
        "category_name": cat.get("name"),
        "price": body.price,
        "description": body.description,
        "images": body.images,
        "item_info": body.item_info,
        "seller_id": u["id"],
        "seller_name": u.get("display_name"),
        "status": "pending",
        "availability": "available",
        "is_demo": False,
        "featured": False,
        "reject_reason": None,
        "created_at": now().isoformat(),
    }
    await db.listings.insert_one(listing)
    return strip_id(listing)


@api.post("/listings/{listing_id}/moderate")
async def moderate_listing(listing_id: str, body: ListingModerate, admin: dict = Depends(require_admin)):
    update: dict = {}
    if body.action == "approve":
        update = {"status": "approved", "reject_reason": None}
    else:
        update = {"status": "rejected", "reject_reason": body.reason or "Tidak sesuai kebijakan"}
    r = await db.listings.update_one({"id": listing_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(404, "Listing tidak ditemukan")
    await db.audit_logs.insert_one(
        {"id": new_id(), "admin_id": admin["id"], "action": f"listing_{body.action}", "target": listing_id, "at": now().isoformat()}
    )
    return {"ok": True}


@api.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, u: dict = Depends(get_current_user)):
    l = await db.listings.find_one({"id": listing_id})
    if not l:
        raise HTTPException(404, "Not found")
    if l["seller_id"] != u["id"] and u.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    await db.listings.delete_one({"id": listing_id})
    return {"ok": True}


# ---------------- Favorites ----------------
@api.get("/favorites")
async def my_favorites(u: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": u["id"]}, {"_id": 0}).to_list(500)
    ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find({"id": {"$in": ids}}, {"_id": 0}).to_list(500)
    return listings


@api.post("/favorites/{listing_id}")
async def add_favorite(listing_id: str, u: dict = Depends(get_current_user)):
    await db.favorites.update_one(
        {"user_id": u["id"], "listing_id": listing_id},
        {"$setOnInsert": {"id": new_id(), "user_id": u["id"], "listing_id": listing_id, "created_at": now().isoformat()}},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/favorites/{listing_id}")
async def remove_favorite(listing_id: str, u: dict = Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": u["id"], "listing_id": listing_id})
    return {"ok": True}


# ---------------- Payment Methods ----------------
@api.get("/payment-methods")
async def list_payment_methods():
    cursor = db.payment_methods.find({"enabled": True}, {"_id": 0}).sort("sort_order", 1)
    return await cursor.to_list(50)


@api.get("/admin/payment-methods")
async def admin_list_payment_methods(admin: dict = Depends(require_admin)):
    cursor = db.payment_methods.find({}, {"_id": 0}).sort("sort_order", 1)
    return await cursor.to_list(50)


@api.post("/admin/payment-methods")
async def create_payment_method(body: PaymentMethodReq, admin: dict = Depends(require_admin)):
    pm = {"id": new_id(), **body.model_dump(), "created_at": now().isoformat()}
    await db.payment_methods.insert_one(pm)
    return strip_id(pm)


@api.put("/admin/payment-methods/{pm_id}")
async def update_payment_method(pm_id: str, body: PaymentMethodReq, admin: dict = Depends(require_admin)):
    r = await db.payment_methods.update_one({"id": pm_id}, {"$set": body.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.delete("/admin/payment-methods/{pm_id}")
async def delete_payment_method(pm_id: str, admin: dict = Depends(require_admin)):
    await db.payment_methods.delete_one({"id": pm_id})
    return {"ok": True}


# ---------------- Orders ----------------
@api.post("/orders")
async def create_order(body: OrderCreate, u: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": body.listing_id})
    if not listing:
        raise HTTPException(404, "Listing tidak ditemukan")
    if listing.get("status") != "approved":
        raise HTTPException(400, "Listing belum tersedia")
    if listing.get("availability") != "available":
        raise HTTPException(400, "Listing sedang dipesan atau sudah terjual")
    if listing["seller_id"] == u["id"]:
        raise HTTPException(400, "Tidak bisa membeli listing sendiri")
    pm = await db.payment_methods.find_one({"id": body.payment_method_id})
    if not pm:
        raise HTTPException(400, "Metode pembayaran tidak valid")
    # reserve stock
    r = await db.listings.update_one(
        {"id": body.listing_id, "availability": "available"},
        {"$set": {"availability": "reserved"}},
    )
    if r.modified_count == 0:
        raise HTTPException(409, "Listing baru saja dipesan pembeli lain")
    order = {
        "id": new_id(),
        "buyer_id": u["id"],
        "buyer_name": u.get("display_name"),
        "seller_id": listing["seller_id"],
        "seller_name": listing.get("seller_name"),
        "listing_id": listing["id"],
        "listing_snapshot": {
            "title": listing["title"],
            "price": listing["price"],
            "images": listing.get("images", [])[:1],
            "category_name": listing.get("category_name"),
        },
        "total": listing["price"],
        "payment": {
            "method_id": pm["id"],
            "method_name": pm["name"],
            "method_type": pm["type"],
            "account_number": pm.get("account_number"),
            "account_name": pm.get("account_name"),
            "bank_name": pm.get("bank_name"),
            "instructions": pm.get("instructions"),
            "qris_image_url": pm.get("qris_image_url"),
        },
        "status": "pending_payment",
        "proof_url": None,
        "notes": [],
        "created_at": now().isoformat(),
        "expires_at": (now() + timedelta(hours=24)).isoformat(),
    }
    await db.orders.insert_one(order)
    return strip_id(order)


@api.get("/orders/mine")
async def my_orders(u: dict = Depends(get_current_user)):
    cursor = db.orders.find({"buyer_id": u["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/orders/sales")
async def my_sales(u: dict = Depends(get_current_user)):
    cursor = db.orders.find({"seller_id": u["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/orders/{order_id}")
async def get_order(order_id: str, u: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    if u.get("role") != "admin" and u["id"] not in (o["buyer_id"], o["seller_id"]):
        raise HTTPException(403, "Forbidden")
    return o


@api.post("/orders/{order_id}/submit-proof")
async def submit_proof(order_id: str, body: OrderPay, u: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Not found")
    if o["buyer_id"] != u["id"]:
        raise HTTPException(403, "Forbidden")
    if o["status"] != "pending_payment":
        raise HTTPException(400, "Status tidak valid")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "pending_verification", "proof_url": body.proof_url, "proof_note": body.note}},
    )
    return {"ok": True}


@api.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, u: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Not found")
    if u["id"] not in (o["buyer_id"],) and u.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    if o["status"] in ("completed", "cancelled", "refunded"):
        raise HTTPException(400, "Pesanan tidak bisa dibatalkan")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"}})
    await db.listings.update_one({"id": o["listing_id"]}, {"$set": {"availability": "available"}})
    return {"ok": True}


@api.get("/admin/orders")
async def admin_orders(admin: dict = Depends(require_admin)):
    cursor = db.orders.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)


@api.post("/admin/orders/{order_id}/status")
async def admin_update_order(order_id: str, body: OrderStatusUpdate, admin: dict = Depends(require_admin)):
    valid = {
        "pending_payment", "pending_verification", "paid", "pending_delivery",
        "in_progress", "completed", "cancelled", "failed", "dispute",
        "refund_processing", "refunded",
    }
    if body.status not in valid:
        raise HTTPException(400, "Status tidak valid")
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Not found")
    update: dict = {"status": body.status}
    await db.orders.update_one({"id": order_id}, {"$set": update})
    if body.status == "completed":
        await db.listings.update_one({"id": o["listing_id"]}, {"$set": {"availability": "sold"}})
    elif body.status in ("cancelled", "failed", "refunded"):
        await db.listings.update_one({"id": o["listing_id"]}, {"$set": {"availability": "available"}})
    await db.audit_logs.insert_one(
        {"id": new_id(), "admin_id": admin["id"], "action": f"order_{body.status}", "target": order_id, "note": body.note, "at": now().isoformat()}
    )
    return {"ok": True}


# ---------------- Admin: users ----------------
@api.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    cursor = db.users.find({}, {"_id": 0, "password_hash": 0})
    return await cursor.to_list(1000)


@api.post("/admin/users/{user_id}/toggle-disabled")
async def toggle_user(user_id: str, admin: dict = Depends(require_admin)):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(404, "Not found")
    if u["role"] == "admin":
        raise HTTPException(400, "Tidak bisa menonaktifkan admin")
    await db.users.update_one({"id": user_id}, {"$set": {"disabled": not u.get("disabled", False)}})
    return {"ok": True}


# ---------------- Admin: Stats ----------------
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    listings_total = await db.listings.count_documents({})
    listings_pending = await db.listings.count_documents({"status": "pending"})
    listings_approved = await db.listings.count_documents({"status": "approved"})
    orders_total = await db.orders.count_documents({})
    orders_paid = await db.orders.count_documents({"status": {"$in": ["paid", "completed"]}})
    orders_pending = await db.orders.count_documents({"status": {"$in": ["pending_payment", "pending_verification"]}})
    revenue_cursor = db.orders.find({"status": "completed"}, {"_id": 0, "total": 1})
    revenue = sum([o.get("total", 0) async for o in revenue_cursor])
    return {
        "users": users_count,
        "listings_total": listings_total,
        "listings_pending": listings_pending,
        "listings_approved": listings_approved,
        "orders_total": orders_total,
        "orders_paid": orders_paid,
        "orders_pending": orders_pending,
        "revenue": revenue,
    }


# ---------------- Site Settings ----------------
@api.get("/site-settings")
async def get_site_settings():
    s = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    if not s:
        return {}
    return s


@api.put("/admin/site-settings")
async def update_site_settings(body: SiteSettings, admin: dict = Depends(require_admin)):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.site_settings.update_one({"id": "main"}, {"$set": payload, "$setOnInsert": {"id": "main"}}, upsert=True)
    s = await db.site_settings.find_one({"id": "main"}, {"_id": 0})
    return s


# ---------------- Startup Seed ----------------
async def seed():
    log.info("Seeding Danz Store V5...")
    # Admin
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing_admin:
        await db.users.insert_one(
            {
                "id": new_id(),
                "email": ADMIN_EMAIL,
                "password_hash": hash_password(ADMIN_INITIAL_PASSWORD),
                "display_name": "Danz Admin",
                "role": "admin",
                "disabled": False,
                "must_change_password": True,
                "avatar_url": None,
                "created_at": now().isoformat(),
            }
        )
        log.info(f"Seeded admin: {ADMIN_EMAIL}")

    # Categories
    default_cats = [
        ("Free Fire", "free-fire", 1),
        ("Mobile Legends", "mobile-legends", 2),
        ("PUBG Mobile", "pubg-mobile", 3),
        ("Roblox", "roblox", 4),
        ("Genshin Impact", "genshin-impact", 5),
        ("Call of Duty Mobile", "cod-mobile", 6),
        ("Honor of Kings", "honor-of-kings", 7),
        ("Game Lainnya", "lainnya", 99),
    ]
    cat_map = {}
    for name, slug, sort in default_cats:
        existing = await db.categories.find_one({"slug": slug})
        if existing:
            cat_map[slug] = existing["id"]
            continue
        cid = new_id()
        await db.categories.insert_one({"id": cid, "name": name, "slug": slug, "icon_url": None, "sort_order": sort})
        cat_map[slug] = cid

    # Payment methods
    pm_count = await db.payment_methods.count_documents({})
    if pm_count == 0:
        defaults = [
            {"name": "DANA", "type": "ewallet", "account_number": "083899597502", "account_name": "DANZ STORE", "instructions": "Transfer ke nomor DANA di atas, lalu upload bukti transfer.", "enabled": True, "sort_order": 1},
            {"name": "OVO", "type": "ewallet", "account_number": "083899597502", "account_name": "DANZ STORE", "instructions": "Transfer ke nomor OVO di atas, lalu upload bukti transfer.", "enabled": True, "sort_order": 2},
            {"name": "GoPay", "type": "ewallet", "account_number": "083899597502", "account_name": "DANZ STORE", "instructions": "Transfer ke nomor GoPay di atas, lalu upload bukti transfer.", "enabled": True, "sort_order": 3},
            {"name": "QRIS", "type": "qris", "instructions": "Scan QRIS yang ditampilkan di halaman pembayaran, lalu upload bukti transfer.", "qris_image_url": None, "enabled": True, "sort_order": 4},
            {"name": "Transfer BCA", "type": "bank", "bank_name": "BCA", "account_number": "", "account_name": "Belum dikonfigurasi", "instructions": "Nomor rekening BCA belum ditetapkan admin.", "enabled": False, "sort_order": 5},
        ]
        for d in defaults:
            await db.payment_methods.insert_one({"id": new_id(), **d, "created_at": now().isoformat()})
        log.info("Seeded default payment methods")

    # Site settings
    existing_settings = await db.site_settings.find_one({"id": "main"})
    if not existing_settings:
        await db.site_settings.insert_one(
            {
                "id": "main",
                "store_name": "Danz Store V5",
                "tagline": "Marketplace Premium Akun Game",
                "contact_whatsapp": "083899597502",
                "contact_email": ADMIN_EMAIL,
                "announcement": "Selamat datang di Danz Store V5! Marketplace terpercaya untuk jual beli akun game.",
                "maintenance_mode": False,
                "maintenance_message": "",
            }
        )

    # Demo listings
    demo_count = await db.listings.count_documents({"is_demo": True})
    if demo_count == 0:
        # need a seller - use admin
        admin_user = await db.users.find_one({"email": ADMIN_EMAIL})
        if admin_user:
            demo_listings = [
                {"title": "[DEMO] Akun Mobile Legends Mythic Glory 500⭐", "cat": "mobile-legends", "price": 850000, "desc": "Akun Mobile Legends Mythic Glory 500 Bintang, 95+ hero, 120+ skin epic. Data demo untuk showcase."},
                {"title": "[DEMO] Akun Free Fire Grandmaster 50 Bundle", "cat": "free-fire", "price": 450000, "desc": "Free Fire Grandmaster, 50+ bundle legendaris, elite pass season 20+. Data demo."},
                {"title": "[DEMO] Akun Genshin Impact AR60 - 5 Char C6", "cat": "genshin-impact", "price": 2500000, "desc": "Genshin Impact AR 60, 5 character 5* C6, weapon signature. Data demo."},
                {"title": "[DEMO] PUBG Mobile Conqueror + Mythic Set", "cat": "pubg-mobile", "price": 1200000, "desc": "PUBG Mobile Conqueror season terakhir, Mythic set lengkap, M416 Glacier. Data demo."},
                {"title": "[DEMO] Roblox Premium 100k+ Robux", "cat": "roblox", "price": 350000, "desc": "Akun Roblox dengan 100k+ Robux, limited items. Data demo."},
                {"title": "[DEMO] COD Mobile Legendary Mythic AK117", "cat": "cod-mobile", "price": 550000, "desc": "COD Mobile Legendary, Mythic AK117, 50+ legendary skin. Data demo."},
            ]
            demo_images = [
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600",
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600",
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600",
            ]
            for i, d in enumerate(demo_listings):
                cat_id = cat_map.get(d["cat"])
                if not cat_id:
                    continue
                await db.listings.insert_one(
                    {
                        "id": new_id(),
                        "title": d["title"],
                        "category_id": cat_id,
                        "category_name": next((n for n, s, _ in default_cats if s == d["cat"]), ""),
                        "price": d["price"],
                        "description": d["desc"],
                        "images": [demo_images[i % len(demo_images)]],
                        "item_info": "Data DEMO untuk showcase - bukan transaksi nyata.",
                        "seller_id": admin_user["id"],
                        "seller_name": "Danz Admin",
                        "status": "approved",
                        "availability": "available",
                        "is_demo": True,
                        "featured": i < 2,
                        "reject_reason": None,
                        "created_at": now().isoformat(),
                    }
                )
            log.info("Seeded demo listings")


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/")
async def root():
    return {"service": "Danz Store V5 API", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
