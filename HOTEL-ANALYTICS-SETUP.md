# Curated Hotel Hunter analytics

The production web stream uses Measurement ID `G-1MRJFJEYK4`. Enhanced measurement was turned off in the web stream on 23 November 2026 and should stay off for this setup. The site sends a page view and its own hotel events. Only the two production hostnames load Google Analytics, and only after the visitor accepts analytics cookies.

| Event | Visitor action |
| --- | --- |
| `hotel_details_open` | Opens an offer's details on Hotel Finds |
| `hotel_discovery_click` | Follows a tracked link to a hotel on CHH |
| `hotel_outbound_click` | Follows a hotel booking link or affiliate banner |

Each event carries `hotel_name` and `page_path`. Outbound clicks also carry `destination_host`. Full booking links and internal hotel search terms are excluded.

In Google Analytics, open **Admin → Data display → Custom definitions**. Create an event-scoped dimension named **Hotel name** with the event parameter `hotel_name`. In **Explore → Free form**, set rows to **Hotel name** and values to **Event count**. Filter **Event name** to `hotel_outbound_click` for a booking-click ranking. To compare types of engagement, use **Event name** as a column instead.

After deployment, accept analytics on the live site and click a hotel offer. In Realtime, open `hotel_outbound_click` to confirm the event and the hotel name. The report reflects clicks received after setup.
