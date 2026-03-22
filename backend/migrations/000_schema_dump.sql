--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: lender_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lender_type AS ENUM (
    'individual',
    'business'
);


--
-- Name: ensure_single_default_address(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_single_default_address() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE user_addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_addresses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_addresses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_listings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_listings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    image_url character varying(500),
    parent_id integer,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    level integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: hero_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_banners (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    subtitle character varying(300),
    description text,
    image_url character varying(500) NOT NULL,
    mobile_image_url character varying(500),
    category_id integer,
    button_text character varying(50) DEFAULT 'Explore Now'::character varying,
    button_link character varying(300),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: hero_banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hero_banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hero_banners_id_seq OWNED BY public.hero_banners.id;


--
-- Name: lender_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lender_applications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lender_type character varying(20),
    gstin character varying(15),
    trade_name character varying(100),
    legal_owner_name character varying(100),
    full_address text,
    business_address text,
    pincode character varying(10),
    city character varying(100),
    state character varying(100),
    digipin character varying(20),
    ref1_name character varying(100),
    ref1_mobile character varying(15),
    ref2_name character varying(100),
    ref2_mobile character varying(15),
    ref_name character varying(100),
    ref_mobile character varying(15),
    first_id_proof character varying(255),
    second_id_proof character varying(255),
    gst_certificate character varying(255),
    shop_photo character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lender_applications_lender_type_check CHECK (((lender_type)::text = ANY ((ARRAY['individual'::character varying, 'business'::character varying])::text[])))
);


--
-- Name: lender_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lender_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lender_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lender_applications_id_seq OWNED BY public.lender_applications.id;


--
-- Name: listing_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_photos (
    id bigint NOT NULL,
    listing_id bigint NOT NULL,
    storage_type character varying(20) DEFAULT 'local'::character varying,
    photo_path character varying(255) NOT NULL,
    base64_preview text,
    full_url character varying(500),
    metadata jsonb DEFAULT '{}'::jsonb,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT listing_photos_storage_type_check CHECK (((storage_type)::text = ANY ((ARRAY['local'::character varying, 's3'::character varying])::text[])))
);


--
-- Name: listing_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_photos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_photos_id_seq OWNED BY public.listing_photos.id;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id bigint NOT NULL,
    lender_id bigint NOT NULL,
    item_name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    location character varying(150) NOT NULL,
    security_deposit numeric(10,2) DEFAULT 0,
    rental_price_per_day numeric(10,2) NOT NULL,
    availability jsonb,
    terms_and_conditions character varying(300),
    discount_type character varying(20),
    discount_value numeric(10,2),
    discount_start_date date,
    discount_end_date date,
    promo_code character varying(20),
    display_tagline character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer,
    subcategory_id integer,
    condition character varying(50),
    purchase_month integer,
    purchase_year integer,
    item_age character varying(50),
    original_purchase_price numeric(10,2),
    min_rental_days integer DEFAULT 1,
    max_rental_days integer,
    advance_booking_days integer DEFAULT 1,
    delivery_handler_type character varying(20) DEFAULT 'you'::character varying,
    delivery_option character varying(20) DEFAULT 'pickup'::character varying,
    delivery_radius_km integer,
    pincode character varying(10),
    city character varying(100),
    state character varying(100),
    country character varying(100) DEFAULT 'India'::character varying,
    id_verification_required boolean DEFAULT false,
    insurance_available boolean DEFAULT false,
    CONSTRAINT listings_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT listings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listings_id_seq OWNED BY public.listings.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    attempt_id bigint NOT NULL,
    user_id bigint,
    attempt_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    success boolean DEFAULT false,
    failure_reason character varying(255)
);


--
-- Name: login_attempts_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_attempts_attempt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_attempts_attempt_id_seq OWNED BY public.login_attempts.attempt_id;


--
-- Name: login_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_sessions (
    session_id character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    device_info text,
    ip_address character varying(45),
    user_agent text,
    login_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expiry_time timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_logs (
    id integer NOT NULL,
    product_id integer,
    lender_id bigint,
    issue_description text NOT NULL,
    status character varying(20) DEFAULT 'IN_PROGRESS'::character varying,
    estimated_cost numeric(10,2) DEFAULT 0,
    logged_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp with time zone,
    CONSTRAINT maintenance_logs_status_check CHECK (((status)::text = ANY ((ARRAY['REPORTED'::character varying, 'IN_PROGRESS'::character varying, 'RESOLVED'::character varying])::text[])))
);


--
-- Name: maintenance_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_logs_id_seq OWNED BY public.maintenance_logs.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_id character varying(50) NOT NULL,
    product_id integer,
    lender_id bigint,
    borrower_id bigint,
    start_date date NOT NULL,
    end_date date NOT NULL,
    duration_days integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    base_rental_amount numeric(10,2) NOT NULL,
    security_deposit numeric(10,2) DEFAULT 0,
    delivery_charge numeric(10,2) DEFAULT 0,
    platform_fee numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    payment_status character varying(20) DEFAULT 'UNPAID'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['UNPAID'::character varying, 'PAID'::character varying, 'REFUNDED'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'UPCOMING'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'OVERDUE'::character varying])::text[])))
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    token_id bigint NOT NULL,
    user_id bigint NOT NULL,
    reset_token character varying(255) NOT NULL,
    token_expiry timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_token_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNED BY public.password_reset_tokens.token_id;


--
-- Name: pincode_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pincode_master (
    id integer NOT NULL,
    state character varying(150),
    district character varying(150),
    city character varying(150),
    pincode character varying(6),
    state_code integer,
    location_type character varying(20)
);


--
-- Name: social_logins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_logins (
    social_id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider character varying(20) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    access_token text,
    refresh_token text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT social_logins_provider_check CHECK (((provider)::text = ANY ((ARRAY['google'::character varying, 'facebook'::character varying, 'apple'::character varying])::text[])))
);


--
-- Name: social_logins_social_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_logins_social_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_logins_social_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_logins_social_id_seq OWNED BY public.social_logins.social_id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    email character varying(255),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addresses (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(20) DEFAULT 'home'::character varying NOT NULL,
    name character varying(100) NOT NULL,
    mobile character varying(15) NOT NULL,
    pincode character varying(6) NOT NULL,
    state character varying(50) NOT NULL,
    city character varying(50) NOT NULL,
    locality character varying(100) NOT NULL,
    building_no character varying(100) NOT NULL,
    floor character varying(20),
    landmark character varying(100),
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    district character varying(50),
    CONSTRAINT user_addresses_type_check CHECK (((type)::text = ANY ((ARRAY['home'::character varying, 'work'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: user_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_addresses_id_seq OWNED BY public.user_addresses.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    profile_id bigint NOT NULL,
    user_id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date,
    gender character varying(10),
    profile_picture_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    lender boolean DEFAULT false,
    CONSTRAINT user_profiles_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: user_profiles_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_profile_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profiles_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_profile_id_seq OWNED BY public.user_profiles.profile_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    username character varying(50),
    email character varying(255) NOT NULL,
    phone character varying(15),
    password_hash character varying(255) NOT NULL,
    password_salt character varying(50) NOT NULL,
    account_status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    role character varying(20) DEFAULT 'user'::character varying,
    is_verified boolean DEFAULT false,
    otp_code character varying(10),
    otp_expires_at timestamp without time zone,
    CONSTRAINT users_account_status_check CHECK (((account_status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'pending'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'lender'::character varying, 'admin'::character varying, 'both'::character varying])::text[])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: hero_banners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_banners ALTER COLUMN id SET DEFAULT nextval('public.hero_banners_id_seq'::regclass);


--
-- Name: lender_applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lender_applications ALTER COLUMN id SET DEFAULT nextval('public.lender_applications_id_seq'::regclass);


--
-- Name: listing_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_photos ALTER COLUMN id SET DEFAULT nextval('public.listing_photos_id_seq'::regclass);


--
-- Name: listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings ALTER COLUMN id SET DEFAULT nextval('public.listings_id_seq'::regclass);


--
-- Name: login_attempts attempt_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('public.login_attempts_attempt_id_seq'::regclass);


--
-- Name: maintenance_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs ALTER COLUMN id SET DEFAULT nextval('public.maintenance_logs_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: password_reset_tokens token_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.password_reset_tokens_token_id_seq'::regclass);


--
-- Name: social_logins social_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_logins ALTER COLUMN social_id SET DEFAULT nextval('public.social_logins_social_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: user_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses ALTER COLUMN id SET DEFAULT nextval('public.user_addresses_id_seq'::regclass);


--
-- Name: user_profiles profile_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN profile_id SET DEFAULT nextval('public.user_profiles_profile_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: categories categories_name_parent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_parent_id_key UNIQUE (name, parent_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: hero_banners hero_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_banners
    ADD CONSTRAINT hero_banners_pkey PRIMARY KEY (id);


--
-- Name: lender_applications lender_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lender_applications
    ADD CONSTRAINT lender_applications_pkey PRIMARY KEY (id);


--
-- Name: listing_photos listing_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_photos
    ADD CONSTRAINT listing_photos_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: login_sessions login_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_id_key UNIQUE (order_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- Name: pincode_master pincode_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pincode_master
    ADD CONSTRAINT pincode_master_pkey PRIMARY KEY (id);


--
-- Name: social_logins social_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_logins
    ADD CONSTRAINT social_logins_pkey PRIMARY KEY (social_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (profile_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_addresses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_active ON public.user_addresses USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_addresses_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_default ON public.user_addresses USING btree (user_id, is_default) WHERE (is_default = true);


--
-- Name: idx_addresses_pincode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_pincode ON public.user_addresses USING btree (pincode);


--
-- Name: idx_addresses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_user_id ON public.user_addresses USING btree (user_id);


--
-- Name: idx_categories_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_active ON public.categories USING btree (is_active);


--
-- Name: idx_categories_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_level ON public.categories USING btree (level);


--
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- Name: idx_listing_photos_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_photos_listing_id ON public.listing_photos USING btree (listing_id);


--
-- Name: idx_listing_photos_storage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_photos_storage ON public.listing_photos USING btree (storage_type);


--
-- Name: idx_listings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_category ON public.listings USING btree (category) WHERE ((status)::text = 'active'::text);


--
-- Name: idx_listings_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_category_id ON public.listings USING btree (category_id);


--
-- Name: idx_listings_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_city ON public.listings USING btree (city);


--
-- Name: idx_listings_condition; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_condition ON public.listings USING btree (condition);


--
-- Name: idx_listings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at);


--
-- Name: idx_listings_lender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_lender_id ON public.listings USING btree (lender_id);


--
-- Name: idx_listings_pincode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_pincode ON public.listings USING btree (pincode);


--
-- Name: idx_listings_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_state ON public.listings USING btree (state);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_listings_subcategory_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_subcategory_id ON public.listings USING btree (subcategory_id);


--
-- Name: idx_login_attempts_attempt_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_attempt_time ON public.login_attempts USING btree (attempt_time);


--
-- Name: idx_login_attempts_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_ip_address ON public.login_attempts USING btree (ip_address);


--
-- Name: idx_login_attempts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_user_id ON public.login_attempts USING btree (user_id);


--
-- Name: idx_login_sessions_expiry_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_sessions_expiry_time ON public.login_sessions USING btree (expiry_time);


--
-- Name: idx_login_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_sessions_user_id ON public.login_sessions USING btree (user_id);


--
-- Name: idx_password_reset_tokens_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_reset_token ON public.password_reset_tokens USING btree (reset_token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_pincode_master_pincode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pincode_master_pincode ON public.pincode_master USING btree (pincode);


--
-- Name: idx_social_logins_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_logins_user_id ON public.social_logins USING btree (user_id);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: unique_social_logins_provider_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_social_logins_provider_user ON public.social_logins USING btree (provider, provider_user_id);


--
-- Name: user_addresses trigger_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_addresses_updated_at BEFORE UPDATE ON public.user_addresses FOR EACH ROW EXECUTE FUNCTION public.update_addresses_updated_at();


--
-- Name: listings trigger_listings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_listings_updated_at();


--
-- Name: user_addresses trigger_single_default_address; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_single_default_address BEFORE INSERT OR UPDATE ON public.user_addresses FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_address();


--
-- Name: social_logins update_social_logins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_social_logins_updated_at BEFORE UPDATE ON public.social_logins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: listings fk_listing_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT fk_listing_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: listings fk_listing_subcategory; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT fk_listing_subcategory FOREIGN KEY (subcategory_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: hero_banners hero_banners_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_banners
    ADD CONSTRAINT hero_banners_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: lender_applications lender_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lender_applications
    ADD CONSTRAINT lender_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: listing_photos listing_photos_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_photos
    ADD CONSTRAINT listing_photos_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_lender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: login_attempts login_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: login_sessions login_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_sessions
    ADD CONSTRAINT login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_lender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: orders orders_borrower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_borrower_id_fkey FOREIGN KEY (borrower_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_lender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: social_logins social_logins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_logins
    ADD CONSTRAINT social_logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

