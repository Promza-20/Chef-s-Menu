import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import ChefChristoffelLogo from './Logo';
import type { Course, MenuItem, Order, OrderStatus } from './types';
import { initialMenuItems } from './menuData';

type Screen = 'menu' | 'cart' | 'orders' | 'staff';
type MenuFilter = 'All' | "Chef's picks" | Course;

const STORAGE_KEY = '@chefs-menu/app-data';
const MENU_VERSION = 3;
const MENU_VERSION_THREE_IDS = new Set([
  'chef-bruschetta',
  'king-prawn-linguine',
  'fillet-steak',
  'wild-mushroom-risotto',
  'seasonal-vegetables',
  'tiramisu',
  'barista-cappuccino',
  'prawn-starter',
]);
const chefSignatureIds = new Set([
  'beef-burger',
  'grilled-salmon',
  'fillet-steak',
  'king-prawn-linguine',
  'wild-mushroom-risotto',
]);
const courses: Course[] = [
  'Starter',
  'Main Course',
  'Sides',
  'Dessert',
  'Drinks',
];
const orderStatuses: OrderStatus[] = [
  'New',
  'Preparing',
  'Ready',
  'Completed',
];
const heroImage = require('./assets/grilled-salmon.jpg');
const chickenImage = require('./assets/grilled-chicken.jpg');
const soupImage = require('./assets/tomato-soup.jpg');
const cakeImage = require('./assets/chocolate-cake.jpg');
const dishImages: Record<string, number> = {
  'garlic-bread': require('./assets/garlic-bread.jpg'),
  'garden-salad': require('./assets/garden-salad.jpg'),
  'creamy-pasta': require('./assets/creamy-pasta.jpg'),
  'beef-burger': require('./assets/beef-burger.jpg'),
  'margherita-pizza': require('./assets/margherita-pizza.jpg'),
  'grilled-salmon': require('./assets/grilled-salmon.jpg'),
  'golden-fries': require('./assets/golden-fries.jpg'),
  cheesecake: require('./assets/cheesecake.jpg'),
  'fresh-lemonade': require('./assets/lemonade.jpg'),
  'chef-bruschetta': require('./assets/bruschetta.jpg'),
  'king-prawn-linguine': require('./assets/prawn-linguine.jpg'),
  'fillet-steak': require('./assets/steak-frites.jpg'),
  'wild-mushroom-risotto': require('./assets/wild-mushroom-risotto.jpg'),
  'seasonal-vegetables': require('./assets/seasonal-vegetables.jpg'),
  tiramisu: require('./assets/tiramisu.jpg'),
  'barista-cappuccino': require('./assets/espresso.jpg'),
  'prawn-starter': require('./assets/prawn-linguine.jpg'),
};

function mergeSavedMenu(savedItems: MenuItem[], savedVersion: number) {
  const savedIds = new Set(savedItems.map((item) => item.id));
  const itemsToAdd = initialMenuItems.filter((item) => {
    if (savedIds.has(item.id)) {
      return false;
    }
    return savedVersion < 2 || MENU_VERSION_THREE_IDS.has(item.id);
  });
  return [...savedItems, ...itemsToAdd];
}

function formatPrice(price: number) {
  return `R${price.toFixed(2)}`;
}

function imageForDish(item: MenuItem) {
  if (item.imageUri) {
    return { uri: item.imageUri };
  }
  if (dishImages[item.id]) {
    return dishImages[item.id];
  }
  const name = item.name.toLowerCase();
  if (name.includes('chicken')) {
    return chickenImage;
  }
  if (name.includes('soup') || name.includes('tomato')) {
    return soupImage;
  }
  if (name.includes('cake') || name.includes('chocolate')) {
    return cakeImage;
  }
  if (item.course === 'Starter') {
    return soupImage;
  }
  if (item.course === 'Dessert') {
    return cakeImage;
  }
  return chickenImage;
}

export default function HomeScreen() {
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const menuSectionY = useRef(0);
  const [screen, setScreen] = useState<Screen>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<MenuFilter>('All');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCourse, setDishCourse] = useState<Course>('Main Course');
  const [dishImageUri, setDishImageUri] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedData() {
      try {
        const rawData = await AsyncStorage.getItem(STORAGE_KEY);
        if (rawData && isMounted) {
          const savedData = JSON.parse(rawData) as {
            menuItems?: MenuItem[];
            orders?: Order[];
            menuVersion?: number;
          };
          if (Array.isArray(savedData.menuItems)) {
            setMenuItems(
              (savedData.menuVersion ?? 0) < MENU_VERSION
                ? mergeSavedMenu(
                    savedData.menuItems,
                    savedData.menuVersion ?? 0,
                  )
                : savedData.menuItems,
            );
          }
          if (Array.isArray(savedData.orders)) {
            setOrders(savedData.orders);
          }
        }
      } catch {
        if (isMounted) {
          setStorageError('Saved data could not be loaded. Changes may not persist.');
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    void loadSavedData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ menuItems, orders, menuVersion: MENU_VERSION }),
    ).catch(() => {
      setStorageError('Could not save changes to this device.');
    });
  }, [isLoaded, menuItems, orders]);

  const cartItems = useMemo(
    () =>
      menuItems
        .filter((item) => (cart[item.id] ?? 0) > 0)
        .map((item) => ({ item, quantity: cart[item.id] })),
    [cart, menuItems],
  );
  const cartCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, entry) => total + entry.item.price * entry.quantity,
    0,
  );
  const visibleMenuItems = menuItems.filter((item) => {
    const matchesCourse =
      filter === 'All' ||
      (filter === "Chef's picks"
        ? chefSignatureIds.has(item.id)
        : item.course === filter);
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesCourse && matchesSearch;
  });

  function changeQuantity(itemId: string, amount: number) {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[itemId] ?? 0) + amount;
      const nextCart = { ...currentCart };
      if (nextQuantity > 0) {
        nextCart[itemId] = nextQuantity;
      } else {
        delete nextCart[itemId];
      }
      return nextCart;
    });
    setConfirmation('');
    setFormError('');
  }

  function placeOrder() {
    if (!customerName.trim()) {
      setFormError('Enter your name to place the order.');
      return;
    }
    if (cartItems.length === 0) {
      setFormError('Add at least one dish to your order.');
      return;
    }

    const order: Order = {
      id: `${Date.now()}`,
      customerName: customerName.trim(),
      note: orderNote.trim(),
      items: cartItems.map(({ item, quantity }) => ({
        name: item.name,
        quantity,
        unitPrice: item.price,
      })),
      total: cartTotal,
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    setOrders((currentOrders) => [order, ...currentOrders]);
    setCart({});
    setOrderNote('');
    setFormError('');
    setConfirmation(`Order #${order.id} placed. Pay at the restaurant.`);
    setScreen('orders');
  }

  function resetDishForm() {
    setDishName('');
    setDishDescription('');
    setDishPrice('');
    setDishCourse('Main Course');
    setDishImageUri(undefined);
    setEditingId(null);
    setFormError('');
  }

  function startEditing(item: MenuItem) {
    setEditingId(item.id);
    setDishName(item.name);
    setDishDescription(item.description);
    setDishPrice(`${item.price}`);
    setDishCourse(item.course);
    setDishImageUri(item.imageUri);
    setDeleteId(null);
    setFormError('');
  }

  async function pickDishImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFormError('Allow photo access in your device settings to choose a dish image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDishImageUri(result.assets[0].uri);
        setFormError('');
      }
    } catch {
      setFormError('The photo picker could not be opened. Please try again.');
    }
  }

  function saveDish() {
    const name = dishName.trim();
    const description = dishDescription.trim();
    const price = Number(dishPrice);

    if (!name || !description || !dishPrice.trim()) {
      setFormError('Complete the dish name, description, and price.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Enter a valid price greater than zero.');
      return;
    }

    if (editingId) {
      setMenuItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name,
                description,
                price,
                course: dishCourse,
                imageUri: dishImageUri,
              }
            : item,
        ),
      );
    } else {
      setMenuItems((currentItems) => [
        ...currentItems,
        {
          id: `${Date.now()}`,
          name,
          description,
          price,
          course: dishCourse,
          imageUri: dishImageUri,
        },
      ]);
    }
    resetDishForm();
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {screen === 'menu' ? (
          <>
            <View style={styles.topBar}>
              <View style={styles.brandLockup}>
                <ChefChristoffelLogo size={48} />
                <View style={styles.brandCopy}>
                  <Text style={styles.brandEyebrow}>A CHEF CHRISTOFFEL ORIGINAL</Text>
                  <Text style={styles.brand}>Chef Christoffel&apos;s</Text>
                  <Text style={styles.brandSubline}>RESTAURANT & KITCHEN</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open your order, ${cartCount} items`}
                onPress={() => setScreen('cart')}
                style={styles.topCart}
              >
                <Text style={styles.topCartIcon}>🛍</Text>
                {cartCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <ImageBackground
              source={heroImage}
              imageStyle={styles.heroImage}
              style={styles.hero}
            >
              <View style={styles.heroShade}>
                <Text style={styles.heroEyebrow}>CHEF CHRISTOFFEL&apos;S KITCHEN</Text>
                <Text style={styles.heroTitle}>Made with care.{'\n'}Served with love.</Text>
                <Text style={styles.heroSubtitle}>
                  A seasonal menu of thoughtful plates, prepared fresh by our kitchen.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    scrollRef.current?.scrollTo({
                      y: menuSectionY.current,
                      animated: true,
                    })
                  }
                  style={styles.heroButton}
                >
                  <Text style={styles.heroButtonText}>Explore the menu ↓</Text>
                </Pressable>
              </View>
            </ImageBackground>

            <View
              style={styles.sectionHeading}
              onLayout={(event) => {
                menuSectionY.current = event.nativeEvent.layout.y;
              }}
            >
              <View>
                <Text style={styles.sectionEyebrow}>MADE FRESH TODAY</Text>
                <Text style={styles.sectionTitle}>Find your favourite</Text>
              </View>
              <Text style={styles.dishCount}>{menuItems.length} dishes</Text>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="Search dishes"
                value={search}
                onChangeText={setSearch}
                placeholder="Search dishes..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setSearch('')}
                  style={styles.clearSearch}
                >
                  <Text style={styles.clearSearchText}>×</Text>
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(['All', "Chef's picks", ...courses] as MenuFilter[]).map((course) => (
                <Pressable
                  key={course}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === course }}
                  onPress={() => setFilter(course)}
                  style={[
                    styles.filterChip,
                    filter === course && styles.filterChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === course && styles.filterTextSelected,
                    ]}
                  >
                    {course === 'All'
                      ? 'All dishes'
                      : course === "Chef's picks"
                        ? '✦ Chef’s picks'
                        : course}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {storageError ? (
              <Text accessibilityRole="alert" style={styles.errorBanner}>
                {storageError}
              </Text>
            ) : null}

            {visibleMenuItems.length === 0 ? (
              <EmptyState
                title="No dishes found"
                description="Try another search or category."
                action={
                  search || filter !== 'All' ? (
                    <ActionButton
                      label="Show all dishes"
                      onPress={() => {
                        setSearch('');
                        setFilter('All');
                      }}
                    />
                  ) : null
                }
              />
            ) : (
              <View style={styles.menuGrid}>
                {visibleMenuItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={cart[item.id] ?? 0}
                    onAdd={() => changeQuantity(item.id, 1)}
                    onRemove={() => changeQuantity(item.id, -1)}
                  />
                ))}
              </View>
            )}
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Prepared fresh. Always served with care.
              </Text>
            </View>
          </>
        ) : screen === 'cart' ? (
          <>
            <ScreenHeader
              eyebrow="YOUR SELECTION"
              title="Your order"
              subtitle="Review your dishes before sending them to our kitchen."
            />
            {cartItems.length === 0 ? (
              <EmptyState
                title="Your basket is waiting"
                description="Find something delicious on the menu and it will show up here."
                action={
                  <ActionButton
                    label="Browse the menu"
                    onPress={() => setScreen('menu')}
                  />
                }
              />
            ) : (
              <>
                <View style={styles.cartList}>
                  {cartItems.map(({ item, quantity }) => (
                    <View key={item.id} style={styles.cartCard}>
                      <Image source={imageForDish(item)} style={styles.cartImage} />
                      <View style={styles.cartInfo}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.course}>{item.course}</Text>
                        <Text style={styles.cartPrice}>
                          {formatPrice(item.price * quantity)}
                        </Text>
                        <View style={styles.quantityControls}>
                          <QuantityButton
                            label="−"
                            accessibilityLabel={`Remove one ${item.name}`}
                            onPress={() => changeQuantity(item.id, -1)}
                          />
                          <Text style={styles.quantityValue}>{quantity}</Text>
                          <QuantityButton
                            label="+"
                            accessibilityLabel={`Add one ${item.name}`}
                            onPress={() => changeQuantity(item.id, 1)}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.checkoutCard}>
                  <Text style={styles.checkoutTitle}>Order details</Text>
                  <TextInput
                    accessibilityLabel="Your name"
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={colors.muted}
                    value={customerName}
                    onChangeText={setCustomerName}
                    maxLength={60}
                    autoCapitalize="words"
                  />
                  <TextInput
                    accessibilityLabel="Order note"
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Allergies or special requests (optional)"
                    placeholderTextColor={colors.muted}
                    value={orderNote}
                    onChangeText={setOrderNote}
                    multiline
                    maxLength={250}
                  />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>{formatPrice(cartTotal)}</Text>
                  </View>
                  <Text style={styles.paymentHint}>
                    Payment is made at the restaurant.
                  </Text>
                  {formError ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {formError}
                    </Text>
                  ) : null}
                  <ActionButton
                    label="Place my order"
                    onPress={placeOrder}
                    fullWidth
                  />
                </View>
              </>
            )}
          </>
        ) : screen === 'orders' ? (
          <>
            <ScreenHeader
              eyebrow="THANK YOU FOR CHOOSING US"
              title="Your orders"
              subtitle="Keep track of what is cooking."
            />
            {confirmation ? (
              <View style={styles.confirmationCard}>
                <Text style={styles.confirmationIcon}>✓</Text>
                <View style={styles.confirmationCopy}>
                  <Text style={styles.confirmationTitle}>Order received!</Text>
                  <Text style={styles.confirmationText}>{confirmation}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss confirmation"
                  onPress={() => setConfirmation('')}
                  style={styles.dismissButton}
                >
                  <Text style={styles.dismissText}>×</Text>
                </Pressable>
              </View>
            ) : null}
            {orders.length === 0 ? (
              <EmptyState
                title="No orders just yet"
                description="Once you place an order, you can follow its progress here."
                action={
                  <ActionButton
                    label="Explore the menu"
                    onPress={() => setScreen('menu')}
                  />
                }
              />
            ) : (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </>
        ) : (
          <>
            <View style={styles.staffHeader}>
              <View style={styles.staffHeaderCopy}>
                <View style={styles.staffBrand}>
                  <ChefChristoffelLogo size={50} />
                  <View style={styles.staffBrandCopy}>
                    <Text style={styles.staffBrandName}>Chef Christoffel&apos;s</Text>
                    <Text style={styles.staffBrandSubline}>RESTAURANT & KITCHEN</Text>
                  </View>
                </View>
                <Text style={[styles.sectionEyebrow, styles.staffEyebrow]}>
                  RESTAURANT WORKSPACE
                </Text>
                <Text style={styles.staffTitle}>Good service starts here.</Text>
                <Text style={styles.staffSubtitle}>
                  Manage your menu and keep every order moving.
                </Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <StatCard
                value={`${orders.filter((order) => order.status !== 'Completed').length}`}
                label="Active orders"
                icon="◷"
              />
              <StatCard
                value={`${menuItems.length}`}
                label="Menu dishes"
                icon="♨"
              />
            </View>

            <SectionHeader
              eyebrow="KITCHEN"
              title="Incoming orders"
              subtitle="Move orders along as they are prepared."
            />
            {orders.length === 0 ? (
              <EmptyState
                title="Kitchen is clear"
                description="New customer orders will appear here."
              />
            ) : (
              orders.map((order) => {
                const currentIndex = orderStatuses.indexOf(order.status);
                const nextStatus = orderStatuses[currentIndex + 1];
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    staff
                    action={
                      nextStatus ? (
                        <ActionButton
                          label={`Mark ${nextStatus.toLowerCase()}`}
                          onPress={() => updateOrderStatus(order.id, nextStatus)}
                          fullWidth
                        />
                      ) : (
                        <Text style={styles.completedMessage}>
                          This order is complete.
                        </Text>
                      )
                    }
                  />
                );
              })
            )}

            <SectionHeader
              eyebrow="KEEP IT FRESH"
              title={editingId ? 'Edit dish' : 'Menu management'}
              subtitle={
                editingId
                  ? 'Update the details and save your changes.'
                  : 'Add new favourites or update the menu.'
              }
            />
            <View style={styles.formCard}>
              <TextInput
                accessibilityLabel="Dish name"
                style={styles.input}
                placeholder="Dish name"
                placeholderTextColor={colors.muted}
                value={dishName}
                onChangeText={setDishName}
                maxLength={80}
              />
              <TextInput
                accessibilityLabel="Dish description"
                style={[styles.input, styles.multilineInput]}
                placeholder="Describe the dish"
                placeholderTextColor={colors.muted}
                value={dishDescription}
                onChangeText={setDishDescription}
                multiline
                maxLength={250}
              />
              <TextInput
                accessibilityLabel="Dish price in rand"
                style={styles.input}
                placeholder="Price in rand (e.g. 120)"
                placeholderTextColor={colors.muted}
                value={dishPrice}
                onChangeText={setDishPrice}
                keyboardType="decimal-pad"
              />
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.courseOptions}>
                {courses.map((course) => (
                  <Pressable
                    key={course}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dishCourse === course }}
                    onPress={() => setDishCourse(course)}
                    style={[
                      styles.courseOption,
                      dishCourse === course && styles.courseOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.courseOptionText,
                        dishCourse === course && styles.courseOptionTextSelected,
                      ]}
                    >
                      {course}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={pickDishImage}
                style={styles.photoPicker}
              >
                {dishImageUri ? (
                  <Image
                    source={{ uri: dishImageUri }}
                    style={styles.photoPreview}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderIcon}>＋</Text>
                  </View>
                )}
                <View style={styles.photoCopy}>
                  <Text style={styles.photoTitle}>
                    {dishImageUri ? 'Change dish photo' : 'Add a dish photo'}
                  </Text>
                  <Text style={styles.photoSubtitle}>
                    Choose an image from your device
                  </Text>
                </View>
                <Text style={styles.photoArrow}>›</Text>
              </Pressable>
              {formError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {formError}
                </Text>
              ) : null}
              <ActionButton
                label={editingId ? 'Save changes' : 'Add dish to menu'}
                onPress={saveDish}
                fullWidth
              />
              {editingId ? (
                <ActionButton
                  label="Cancel editing"
                  onPress={resetDishForm}
                  secondary
                  fullWidth
                />
              ) : null}
            </View>

            <SectionHeader
              eyebrow="LIVE MENU"
              title={`Your dishes (${menuItems.length})`}
              subtitle="Customers see these dishes on the ordering screen."
            />
            {menuItems.length === 0 ? (
              <EmptyState
                title="Your menu is empty"
                description="Add a dish above to start building your menu."
              />
            ) : (
              menuItems.map((item) => (
                <StaffMenuCard
                  key={item.id}
                  item={item}
                  deleting={deleteId === item.id}
                  onEdit={() => startEditing(item)}
                  onRemove={() => setDeleteId(item.id)}
                  onConfirmRemove={() => {
                    setMenuItems((currentItems) =>
                      currentItems.filter(
                        (currentItem) => currentItem.id !== item.id,
                      ),
                    );
                    setDeleteId(null);
                    if (editingId === item.id) {
                      resetDishForm();
                    }
                  }}
                  onCancelRemove={() => setDeleteId(null)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavButton
          active={screen === 'menu'}
          icon="⌂"
          label="Menu"
          onPress={() => setScreen('menu')}
        />
        <NavButton
          active={screen === 'cart'}
          icon="🛍"
          label={cartCount > 0 ? `Cart · ${cartCount}` : 'Cart'}
          onPress={() => setScreen('cart')}
        />
        <NavButton
          active={screen === 'orders'}
          icon="◷"
          label="Orders"
          onPress={() => setScreen('orders')}
        />
        <NavButton
          active={screen === 'staff'}
          icon="☰"
          label="Staff"
          onPress={() => {
            setScreen('staff');
            setFormError('');
          }}
        />
      </View>
    </View>
  );
}

function MenuCard({
  item,
  onAdd,
  onRemove,
  quantity,
}: {
  item: MenuItem;
  onAdd: () => void;
  onRemove: () => void;
  quantity: number;
}) {
  return (
    <View style={styles.menuCard}>
      <View style={styles.menuImageWrap}>
        <Image source={imageForDish(item)} style={styles.menuImage} />
        <Text style={styles.menuCourseTag}>{item.course}</Text>
        {chefSignatureIds.has(item.id) ? (
          <View style={styles.signatureTag}>
            <Text style={styles.signatureTagText}>CHEF&apos;S SIGNATURE</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.menuCardBody}>
        <View style={styles.menuTitleRow}>
          <Text style={styles.menuTitle}>{item.name}</Text>
          <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
        </View>
        <Text style={styles.menuDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.menuCardFooter}>
          <Text style={styles.freshLabel}>✦  Made fresh</Text>
          {quantity > 0 ? (
            <View style={styles.quantityControls}>
              <QuantityButton
                label="−"
                accessibilityLabel={`Remove one ${item.name}`}
                onPress={onRemove}
              />
              <Text style={styles.quantityValue}>{quantity}</Text>
              <QuantityButton
                label="+"
                accessibilityLabel={`Add one ${item.name}`}
                onPress={onAdd}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onAdd}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>＋ Add</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function QuantityButton({
  accessibilityLabel,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quantityButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.quantityButtonText}>{label}</Text>
    </Pressable>
  );
}

function ScreenHeader({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenBrand}>
        <ChefChristoffelLogo size={42} />
        <View>
          <Text style={styles.brandEyebrow}>CHEF CHRISTOFFEL&apos;S</Text>
          <Text style={styles.screenBrandSubline}>RESTAURANT & KITCHEN</Text>
        </View>
      </View>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SectionHeader({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ActionButton({
  danger = false,
  fullWidth = false,
  label,
  onPress,
  secondary = false,
}: {
  danger?: boolean;
  fullWidth?: boolean;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidthButton,
        secondary && styles.secondaryButton,
        danger && styles.dangerButton,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryButtonText,
          danger && styles.dangerButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NavButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.navButton}
    >
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
      {active ? <View style={styles.navIndicator} /> : null}
    </Pressable>
  );
}

function EmptyState({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>✦</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action}
    </View>
  );
}

function OrderCard({
  action,
  order,
  staff = false,
}: {
  action?: React.ReactNode;
  order: Order;
  staff?: boolean;
}) {
  const date = new Date(order.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={styles.orderIdWrap}>
          <Text style={styles.orderEyebrow}>
            {staff ? 'CUSTOMER ORDER' : 'ORDER'}
          </Text>
          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
        </View>
        <Text
          style={[
            styles.statusPill,
            order.status === 'Completed' && styles.statusCompleted,
            order.status === 'Ready' && styles.statusReady,
          ]}
        >
          {order.status}
        </Text>
      </View>
      <View style={styles.orderMeta}>
        <Text style={styles.orderCustomer}>
          {staff ? `For ${order.customerName}` : order.customerName}
        </Text>
        <Text style={styles.orderDate}>{dateLabel}</Text>
      </View>
      <View style={styles.orderDivider} />
      {order.items.map((item, index) => (
        <View key={`${order.id}-${index}`} style={styles.orderLine}>
          <Text style={styles.orderLineName}>
            <Text style={styles.orderLineQty}>{item.quantity}× </Text>
            {item.name}
          </Text>
          <Text style={styles.orderLinePrice}>
            {formatPrice(item.quantity * item.unitPrice)}
          </Text>
        </View>
      ))}
      {order.note ? (
        <Text style={styles.orderNote}>Note: {order.note}</Text>
      ) : null}
      <View style={[styles.orderLine, styles.orderTotal]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>{formatPrice(order.total)}</Text>
      </View>
      {action}
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StaffMenuCard({
  deleting,
  item,
  onCancelRemove,
  onConfirmRemove,
  onEdit,
  onRemove,
}: {
  deleting: boolean;
  item: MenuItem;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.staffDishCard}>
      <Image source={imageForDish(item)} style={styles.staffDishImage} />
      <View style={styles.staffDishContent}>
        <View style={styles.staffDishHeading}>
          <View style={styles.dishDetails}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.course}>{item.course}</Text>
          </View>
          <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
        </View>
        <Text style={styles.menuDescription}>{item.description}</Text>
        {deleting ? (
          <View style={styles.deleteConfirmation}>
            <Text style={styles.deleteText}>Remove this dish from your menu?</Text>
            <View style={styles.staffActions}>
              <ActionButton
                label="Yes, remove"
                onPress={onConfirmRemove}
                danger
              />
              <ActionButton
                label="Keep dish"
                onPress={onCancelRemove}
                secondary
              />
            </View>
          </View>
        ) : (
          <View style={styles.staffActions}>
            <ActionButton label="Edit dish" onPress={onEdit} secondary />
            <ActionButton label="Remove" onPress={onRemove} danger />
          </View>
        )}
      </View>
    </View>
  );
}

const colors = {
  paper: '#F8F6F0',
  white: '#FFFFFF',
  ink: '#263128',
  green: '#244B38',
  muted: '#85877E',
  gold: '#BB8A4B',
  line: '#EAE7DE',
  paleGreen: '#EAF0E9',
  red: '#973A2E',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingBottom: 28,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  topBar: {
    minHeight: 78,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  brandCopy: {
    justifyContent: 'center',
  },
  brandEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  brand: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  brandSubline: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  topCart: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  topCartIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  hero: {
    height: 250,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: colors.green,
  },
  heroImage: {
    borderRadius: 22,
  },
  heroShade: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 23,
    backgroundColor: 'rgba(20, 35, 26, 0.51)',
  },
  heroEyebrow: {
    color: '#F1D2A3',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: 'Georgia',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    marginTop: 9,
  },
  heroSubtitle: {
    color: '#F5F2E9',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 260,
    marginTop: 8,
  },
  heroButton: {
    backgroundColor: '#F5E8D4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  heroButtonText: {
    color: colors.green,
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeading: {
    marginHorizontal: 22,
    marginTop: 27,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontFamily: 'Georgia',
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  dishCount: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 3,
  },
  searchBox: {
    minHeight: 48,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchIcon: {
    color: colors.gold,
    fontSize: 26,
    marginRight: 10,
    lineHeight: 28,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 11,
  },
  clearSearch: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: colors.muted,
    fontSize: 22,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextSelected: {
    color: colors.white,
  },
  menuGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  menuCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuImageWrap: {
    height: 166,
    position: 'relative',
    backgroundColor: '#E9E4D9',
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuCourseTag: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    overflow: 'hidden',
    color: colors.green,
    backgroundColor: '#F8F6F0',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  signatureTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.green,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signatureTagText: {
    color: '#F3D8A9',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  menuCardBody: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 14,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 17,
    fontFamily: 'Georgia',
    fontWeight: '800',
  },
  menuPrice: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '800',
  },
  menuDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  menuCardFooter: {
    minHeight: 38,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freshLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: colors.paper,
  },
  quantityButtonText: {
    color: colors.green,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
  },
  quantityValue: {
    minWidth: 15,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  footerNote: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  footerNoteText: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  bottomNav: {
    minHeight: 62,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  navButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navIcon: {
    color: colors.muted,
    fontSize: 19,
  },
  navIconActive: {
    color: colors.green,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: colors.green,
    fontWeight: '800',
  },
  navIndicator: {
    position: 'absolute',
    top: 0,
    width: 23,
    height: 2,
    backgroundColor: colors.gold,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  screenHeader: {
    paddingHorizontal: 23,
    paddingTop: 30,
    paddingBottom: 19,
  },
  screenBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 20,
  },
  screenBrandSubline: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 5,
  },
  screenSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  cartList: {
    paddingHorizontal: 16,
    gap: 11,
  },
  cartCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cartImage: {
    width: 112,
    minHeight: 142,
    backgroundColor: colors.line,
  },
  cartInfo: {
    flex: 1,
    padding: 13,
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  course: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  cartPrice: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  checkoutCard: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  checkoutTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 11,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  totalPrice: {
    color: colors.green,
    fontSize: 19,
    fontWeight: '800',
  },
  paymentHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 5,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 41,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: colors.green,
    marginTop: 10,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
    minHeight: 48,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.paleGreen,
  },
  secondaryButtonText: {
    color: colors.green,
  },
  dangerButton: {
    backgroundColor: '#F7EAE7',
  },
  dangerButtonText: {
    color: colors.red,
  },
  emptyCard: {
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyIcon: {
    color: colors.gold,
    fontSize: 28,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },
  confirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.paleGreen,
  },
  confirmationIcon: {
    width: 34,
    height: 34,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 17,
    color: colors.white,
    backgroundColor: colors.green,
    fontSize: 19,
    fontWeight: '800',
  },
  confirmationCopy: {
    flex: 1,
    marginLeft: 10,
  },
  confirmationTitle: {
    color: colors.green,
    fontWeight: '800',
    fontSize: 13,
  },
  confirmationText: {
    color: colors.ink,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  dismissButton: {
    width: 30,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: colors.green,
    fontSize: 23,
  },
  staffHeader: {
    margin: 16,
    padding: 20,
    borderRadius: 19,
    backgroundColor: colors.green,
  },
  staffHeaderCopy: {
    maxWidth: 320,
  },
  staffBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 17,
  },
  staffBrandCopy: {
    flex: 1,
  },
  staffBrandName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  staffBrandSubline: {
    color: '#DDE8DF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  staffEyebrow: {
    color: '#E4C48F',
  },
  staffTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 6,
  },
  staffSubtitle: {
    color: '#DDE8DF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statIcon: {
    color: colors.gold,
    fontSize: 17,
  },
  statValue: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 7,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  sectionBlock: {
    paddingHorizontal: 21,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderIdWrap: {
    flex: 1,
  },
  orderEyebrow: {
    color: colors.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  orderId: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  statusPill: {
    overflow: 'hidden',
    color: '#8A5928',
    backgroundColor: '#F8EEDD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    fontSize: 10,
    fontWeight: '800',
  },
  statusReady: {
    color: colors.green,
    backgroundColor: colors.paleGreen,
  },
  statusCompleted: {
    color: colors.muted,
    backgroundColor: '#F0F0ED',
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 7,
  },
  orderCustomer: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  orderDate: {
    color: colors.muted,
    fontSize: 10,
  },
  orderDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 12,
  },
  orderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 7,
  },
  orderLineName: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
  },
  orderLineQty: {
    color: colors.gold,
    fontWeight: '800',
  },
  orderLinePrice: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  orderNote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  orderTotal: {
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: 10,
    marginTop: 13,
  },
  completedMessage: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
  },
  formCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  fieldLabel: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 12,
    marginTop: 15,
  },
  courseOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  courseOption: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  courseOptionSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  courseOptionText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  courseOptionTextSelected: {
    color: colors.white,
  },
  photoPicker: {
    minHeight: 76,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5D2C7',
    backgroundColor: colors.paper,
    borderRadius: 13,
    padding: 10,
    marginTop: 13,
  },
  photoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paleGreen,
  },
  photoPlaceholderIcon: {
    color: colors.green,
    fontSize: 25,
    fontWeight: '400',
  },
  photoPreview: {
    width: 54,
    height: 54,
    borderRadius: 11,
  },
  photoCopy: {
    flex: 1,
    marginLeft: 11,
  },
  photoTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  photoSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  photoArrow: {
    color: colors.muted,
    fontSize: 25,
    marginHorizontal: 6,
  },
  staffDishCard: {
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 11,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  staffDishImage: {
    width: '100%',
    height: 130,
    backgroundColor: colors.line,
  },
  staffDishContent: {
    padding: 14,
  },
  staffDishHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dishDetails: {
    flex: 1,
  },
  staffActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 5,
  },
  deleteConfirmation: {
    marginTop: 7,
  },
  deleteText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  errorText: {
    color: colors.red,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  errorBanner: {
    color: colors.red,
    backgroundColor: '#F7EAE7',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
});
