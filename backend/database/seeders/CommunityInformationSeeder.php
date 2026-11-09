<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\CommunityInformation;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommunityInformationSeeder extends Seeder
{
    /**
     * Seed realistic community profiles for Khulna municipal areas.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@demo.test')->first();

        $profiles = [
            'Sonadanga R/A' => [
                'transport' => 'Frequent Easy-Bikes and Rickshaws available on main and inner roads. 5 minutes to Sonadanga Bus Terminal with countrywide bus connections.',
                'waterlogging' => 'Low to moderate risk during heavy monsoon rains in some sub-lanes; main residential avenues have modernized drainage.',
                'internet' => 'Excellent fiber coverage: Carnival, AmberIT, Dot Internet, and local cable ISPs providing up to 100 Mbps.',
                'noise' => 'Peaceful residential atmosphere with minimal traffic noise inside the residential blocks.',
                'safety' => 'Active neighborhood night guards, well-lit street poles, and Sonadanga Model Police Station within 1.5 km.',
                'general' => 'Premier residential area with grocery superstores, medical clinics, schools, and central mosques within walking distance.',
            ],
            'Boyra' => [
                'transport' => 'Direct Mahindra and auto routes connecting to Shibbari and Daulatpur. Proximity to Mujgunni main highway.',
                'waterlogging' => 'Generally safe from persistent waterlogging due to elevated ground elevation and wide primary roadside drains.',
                'internet' => 'Reliable high-speed fiber broadband coverage from multiple Tier-1 national ISPs.',
                'noise' => 'Moderate noise near Boyra Main Road; inner residential sectors remain quiet and family-friendly.',
                'safety' => 'Very safe residential hub with family dominance, educational institutions, and regular police patrols.',
                'general' => 'Close to Khulna Medical College Hospital, Boyra Government College, banks, and daily kitchen bazaars.',
            ],
            'Mujgunni' => [
                'transport' => 'Easy-bikes readily accessible at Mujgunni bus stop; 10 minutes drive to Khulna Medical College and New Market.',
                'waterlogging' => 'Minimal waterlogging issues; recent municipal drainage improvements ensure rapid stormwater clearance.',
                'internet' => 'Broadband coverage is widespread and stable, with popular local ISP hubs and high uptime.',
                'noise' => 'Low to moderate ambient sound levels suitable for students, bachelors, and growing families.',
                'safety' => 'Well-monitored residential zone with cooperative society vigilance and reliable streetlights.',
                'general' => 'Popular among medical students, doctors, and professionals due to hospital proximity and affordable rents.',
            ],
            'Nirala' => [
                'transport' => 'Rickshaws and battery-run autos dominate. 5 to 7 minutes to Dakbangla commercial center and Royal Mor.',
                'waterlogging' => 'Low-lying sectors experience temporary rainwater accumulation during high tide monsoons, draining within a few hours.',
                'internet' => 'Complete fiber-to-the-home (FTTH) infrastructure supported by all major ISPs.',
                'noise' => 'Quiet, leafy neighborhood characterized by planned plots, parks, and calm residential lanes.',
                'safety' => 'Gated community culture with private security checkpoints and neighborhood watch committees.',
                'general' => 'Established upscale residential neighborhood near Nirala Playground, prestigious English medium schools, and specialty clinics.',
            ],
            'Khalishpur' => [
                'transport' => 'High frequency of public buses, tempo, and easy-bikes along BIDC road and Mujgunni link road.',
                'waterlogging' => 'Well-engineered industrial-era road drainage minimizes standing water even after heavy downpours.',
                'internet' => 'Competitive ISP market with budget-friendly high-speed fiber packages for students and workers.',
                'noise' => 'Vibrant, bustling urban activity along main streets; quieter secondary streets inside housing blocks.',
                'safety' => 'Khalishpur Thana nearby, active commercial bazaars until late night ensure populated, safe thoroughfares.',
                'general' => 'Extremely affordable living costs with expansive public parks, playgrounds, and bustling local kitchen markets.',
            ],
            'Daulatpur' => [
                'transport' => 'Connected by northern transit routes, suburban train station, and inter-district bus corridors.',
                'waterlogging' => 'Moderate rainwater drainage near canal outfalls; high-lying areas stay dry year-round.',
                'internet' => 'High-speed broadband readily available along all major roads and housing quarters.',
                'noise' => 'Active commercial hub near Daulatpur Bazar; quieter in university feeder neighborhoods.',
                'safety' => 'Safe community with long-standing local merchant and student populations.',
                'general' => 'Strategic northern hub close to BL College and industrial areas; excellent balance of rent and living amenities.',
            ],
            'Shibbari' => [
                'transport' => 'Central transit roundabout of Khulna. 24/7 transport availability to all municipal corners and inter-district hubs.',
                'waterlogging' => 'Modernized municipal storm drains prevent standing water on main avenues.',
                'internet' => 'Enterprise-grade optical fiber with redundant routing from top national providers.',
                'noise' => 'High urban energy near Shibbari Mor; sound-insulating multi-story buildings recommended for light sleepers.',
                'safety' => 'Continuous police presence, commercial CCTV coverage, and well-lit intersections 24/7.',
                'general' => 'Heart of the city with corporate offices, shopping malls, prestigious diagnostic centers, and premier dining spots.',
            ],
            'Choto Boyra' => [
                'transport' => 'Shared auto-rickshaws connect easily to Boyra Main Road and Khulna Medical College roundabout.',
                'waterlogging' => 'Low risk of waterlogging; natural slope towards primary canal system.',
                'internet' => 'Fast residential fiber connections available at student-friendly pricing tiers.',
                'noise' => 'Very calm, domestic atmosphere with minimal vehicular traffic on residential alleys.',
                'safety' => 'Close-knit community atmosphere where neighbors know each other well.',
                'general' => 'Ideal for small families and students seeking budget-friendly housing within walking distance of Boyra institutions.',
            ],
            'Gollamari' => [
                'transport' => 'Abundant rickshaws and easy-bikes on Gollamari Main Road; 3 minutes to Khulna University campus.',
                'waterlogging' => 'May experience seasonal waterlogging near the Mayur river embankments during extreme monsoon tides.',
                'internet' => 'Multiple student-oriented ISP packages offering high-speed connections and gaming caches.',
                'noise' => 'Lively student culture around university gates; quiet residential colonies behind the main road.',
                'safety' => 'Safe environment with regular campus security and community police oversight.',
                'general' => 'Prime destination for Khulna University faculty, research scholars, students, and university staff.',
            ],
            'KDA Avenue' => [
                'transport' => 'Wide multi-lane central boulevard with instant access to ride-sharing, CNGs, and public transit.',
                'waterlogging' => 'No waterlogging issues; top-tier municipal drainage infrastructure.',
                'internet' => 'Gigabit fiber connections and enterprise-grade corporate connectivity.',
                'noise' => 'Urban thoroughfare during business hours; calm and peaceful during late evening and night.',
                'safety' => 'High-security zone with corporate bank branches, administrative headquarters, and vigilant surveillance.',
                'general' => 'Prestige address featuring luxury high-rise apartments, brand showrooms, international schools, and fine dining.',
            ],
            'Rupsha' => [
                'transport' => 'Gateway to Khan Jahan Ali (Rupsha) Bridge and southern districts; ferry ghat and riverboat transit available.',
                'waterlogging' => 'Riverine area with engineered embankments; low-lying riverbank alleys may experience tidal dampness.',
                'internet' => 'Fiber optic networks available across major residential clusters and wholesale markets.',
                'noise' => 'Moderate industrial and wholesale trading noise during early morning business hours.',
                'safety' => 'Active river police station, local community watch, and populated bazaars.',
                'general' => 'Close to fresh fish markets, riverside walking promenades, and scenic views of the Rupsha river.',
            ],
        ];

        foreach ($profiles as $areaName => $info) {
            $area = Area::where('name', $areaName)->first();
            if (! $area) {
                continue;
            }

            // Phase A.1: Preserve human administrator-authored records
            $existing = CommunityInformation::with('updater')->where('area_id', $area->id)->first();
            if ($existing && $existing->updater instanceof User && ! str_ends_with($existing->updater->email, '@demo.test')) {
                continue;
            }

            CommunityInformation::updateOrCreate(
                ['area_id' => $area->id],
                array_merge($info, [
                    'updated_by' => $admin?->id,
                ])
            );
        }
    }
}
