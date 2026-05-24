<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('foods', function (Blueprint $table) {
            if (!Schema::hasColumn('foods', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name');
            }
        });

        Schema::table('conditions', function (Blueprint $table) {
            if (!Schema::hasColumn('conditions', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name');
            }
        });

        Schema::table('dietary_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('dietary_rules', 'reason_ar')) {
                $table->text('reason_ar')->nullable()->after('reason');
            }
        });

        Schema::table('global_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('global_rules', 'reason_ar')) {
                $table->text('reason_ar')->nullable()->after('reason');
            }
        });

        $foodTranslations = [
            'Baked Potato melted on it Mozarella cheese' => 'بطاطا مشوية مع جبنة موزاريلا مذابة',
            'banana' => 'موز',
            'berries' => 'توت',
            'bread' => 'خبز',
            'butter' => 'زبدة',
            'carbonated drinks' => 'مشروبات غازية',
            'chicken breast' => 'صدر دجاج',
            'clarified butter' => 'سمن',
            'Cooked Cheese' => 'جبنة مطبوخة',
            'corn' => 'ذرة',
            'croissant' => 'كرواسون',
            'Dairy products except cooked cheese' => 'منتجات الألبان ما عدا الجبن المطبوخ',
            'dates' => 'تمر',
            'eggs' => 'بيض',
            'Energy drinks' => 'مشروبات الطاقة',
            'figs' => 'تين',
            'fish' => 'سمك',
            'Fresh Juices' => 'عصائر طازجة',
            'grapes' => 'عنب',
            'green tea' => 'شاي أخضر',
            'Ground Beef with cooked cheese on Toast' => 'لحم بقري مفروم مع جبنة مطبوخة على توست',
            'honey' => 'عسل',
            'Jams: Cherry, Figs, Berries' => 'مربى: كرز، تين، توت',
            'Juices: Grapes, Cherry, Guafa, Berries.' => 'عصائر: عنب، كرز، جوافة، توت',
            'Kibbeh' => 'كبة',
            'legumes' => 'بقوليات',
            'mango' => 'مانجو',
            'meat' => 'لحم',
            'melon' => 'شمام',
            'milk' => 'حليب',
            'Nuts' => 'مكسرات',
            'Oats' => 'شوفان',
            'olive oil' => 'زيت زيتون',
            'olives' => 'زيتون',
            'Pasta' => 'معكرونة',
            'Pigeon meat + rice' => 'لحم حمام مع أرز',
            'Pomegranate without seeds.' => 'رمان بدون بذور',
            'popcorn' => 'فشار',
            'pork' => 'لحم خنزير',
            'potato' => 'بطاطا',
            'red tea' => 'شاي أحمر',
            'rice' => 'أرز',
            'Rice with ground beef' => 'أرز مع لحم بقري مفروم',
            'salmon' => 'سلمون',
            'tuna' => 'تونة',
            'vegetables' => 'خضروات',
            'watermelon' => 'بطيخ',
            'whole grain toast' => 'توست حبوب كاملة',
            'yogurt' => 'زبادي',
        ];

        foreach ($foodTranslations as $name => $nameAr) {
            DB::table('foods')->where('name', $name)->update(['name_ar' => $nameAr]);
        }

        $conditionTranslations = [
            'diabetes' => 'السكري',
            'restricted_diet' => 'نظام غذائي مقيّد',
        ];

        foreach ($conditionTranslations as $name => $nameAr) {
            DB::table('conditions')->where('name', $name)->update(['name_ar' => $nameAr]);
        }
    }

    public function down(): void
    {
        Schema::table('global_rules', function (Blueprint $table) {
            if (Schema::hasColumn('global_rules', 'reason_ar')) {
                $table->dropColumn('reason_ar');
            }
        });

        Schema::table('dietary_rules', function (Blueprint $table) {
            if (Schema::hasColumn('dietary_rules', 'reason_ar')) {
                $table->dropColumn('reason_ar');
            }
        });

        Schema::table('conditions', function (Blueprint $table) {
            if (Schema::hasColumn('conditions', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
        });

        Schema::table('foods', function (Blueprint $table) {
            if (Schema::hasColumn('foods', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
        });
    }
};
