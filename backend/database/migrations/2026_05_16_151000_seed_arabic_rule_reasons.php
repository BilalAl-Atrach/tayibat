<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $translations = [
            'Allowed grain option' => 'خيار حبوب مسموح.',
            'Best Protein source for diabetes' => 'أفضل مصدر بروتين لمرضى السكري.',
            'Buy these juices from the supermarket as carton-packaged juices, not fresh juices.' => 'اشترِ هذه العصائر من المتجر كعصائر معبأة بالكرتون، وليست عصائر طازجة.',
            'Buy these juices from the supermarket as glass-packaged juices, not fresh juices.' => 'اشترِ هذه العصائر من المتجر كعصائر معبأة بالزجاج، وليست عصائر طازجة.',
            'Considered as a good snack, 2 times per week' => 'يعتبر وجبة خفيفة جيدة مرتين في الأسبوع.',
            'Contains antioxidants, healthy drink( no bad consequences )' => 'يحتوي على مضادات أكسدة، وهو مشروب صحي بلا آثار سيئة.',
            'Contains healthy fats and good for anti-aging' => 'يحتوي على دهون صحية ومفيد لمقاومة علامات التقدم في العمر.',
            'Contains natural sugar, High glycemic index(do not spike blood sugar)' => 'يحتوي على سكر طبيعي ومؤشره السكري مرتفع، لذلك يجب الانتباه للكمية.',
            'cooked cheese is allowed' => 'الجبنة المطبوخة مسموحة.',
            'Cooking fat' => 'دهون للطبخ.',
            'Eat several types of cooked cheese which melts under heat not just 1 kind, eat in moderation' => 'تناول عدة أنواع من الجبن المطبوخ الذي يذوب بالحرارة وليس نوعًا واحدًا فقط، وباعتدال.',
            'Energy source' => 'مصدر للطاقة.',
            'Fiber-rich fruit and considered as anti-aging' => 'فاكهة غنية بالألياف وتعتبر مفيدة لمقاومة علامات التقدم في العمر.',
            'Good carbohydrate source' => 'مصدر جيد للكربوهيدرات.',
            'good protein' => 'بروتين جيد.',
            'Good source of energy' => 'مصدر جيد للطاقة.',
            'Healthier grain option' => 'خيار حبوب أكثر صحة.',
            'Healthy beverage' => 'مشروب صحي.',
            'Healthy energy source.' => 'مصدر طاقة صحي.',
            'Healthy fat' => 'دهون صحية.',
            'Healthy Fat source' => 'مصدر دهون صحية.',
            'Healthy fat, supports heart health' => 'دهون صحية تدعم صحة القلب.',
            'Healthy fats but not for every day.' => 'دهون صحية، لكن ليست للاستهلاك اليومي.',
            'Healthy fats but not for everyday.' => 'دهون صحية، لكن ليست للاستهلاك اليومي.',
            'Healthy Fruit option' => 'خيار فاكهة صحي.',
            'Healthy snack and considered as anti-aging' => 'وجبة خفيفة صحية وتعتبر مفيدة لمقاومة علامات التقدم في العمر.',
            'High in omega-3 fatty acids' => 'غني بأحماض أوميغا 3 الدهنية.',
            'High in saturated fat' => 'مرتفع بالدهون المشبعة.',
            'High natural sugar, Have one per day or Eat one every other day(day yes , day no)' => 'مرتفع بالسكر الطبيعي؛ تناول حبة واحدة يوميًا أو يومًا بعد يوم.',
            'High protein seafood' => 'مأكولات بحرية غنية بالبروتين.',
            'High saturated fat, limit intake' => 'مرتفع بالدهون المشبعة، قلل الكمية.',
            'High starch content, limit intake' => 'مرتفع بالنشويات، قلل الكمية.',
            'High sugar content, limit intake' => 'مرتفع بالسكر، قلل الكمية.',
            'Kind of dinner contains allowed food.' => 'نوع عشاء يحتوي على أطعمة مسموحة.',
            'Lean protein source' => 'مصدر بروتين قليل الدهون.',
            'Light snack option' => 'خيار وجبة خفيفة.',
            'Low sugar fruit and high in fiber which slows sugar absorption, rich in antioxidants. Berries such as strwaberries and blueberries' => 'فاكهة قليلة السكر وغنية بالألياف التي تبطئ امتصاص السكر، وغنية بمضادات الأكسدة مثل الفراولة والتوت الأزرق.',
            'Made from allowed food.' => 'مصنوع من أطعمة مسموحة.',
            'Natural sugar source' => 'مصدر سكر طبيعي.',
            'Natural sugar, limit intake' => 'سكر طبيعي، قلل الكمية.',
            'Natural sweetener and the most healthy thing in world' => 'مُحلٍّ طبيعي ويعتبر من الخيارات الصحية.',
            'Pigeons eat mainly legumes and grains; they do not eat food waste.' => 'يتغذى الحمام أساسًا على البقوليات والحبوب ولا يأكل فضلات الطعام.',
            'Primary energy source' => 'مصدر أساسي للطاقة.',
            'Protein source' => 'مصدر بروتين.',
            'Provides carbohydrates ' => 'يوفر الكربوهيدرات.',
            'Provides fiber and slow-digesting carbs' => 'يوفر الألياف وكربوهيدرات بطيئة الهضم.',
            'Rich in omega-3' => 'غني بأوميغا 3.',
            'Rich in protein and omega-3' => 'غني بالبروتين وأوميغا 3.',
            'Seeds are hard for the enzymes.' => 'البذور صعبة على الإنزيمات.',
            'casein protein which makes problems in the stomach' => 'يحتوي على بروتين الكازين الذي قد يسبب مشاكل في المعدة.',
            'causes poisoning, it is not for our enzymes, it is for animals enzymes' => 'قد يسبب التسمم، وهو غير مناسب لإنزيمات الإنسان حسب قواعد طيبات.',
            'contains casein protein which makes problems in the stomach' => 'يحتوي على بروتين الكازين الذي قد يسبب مشاكل في المعدة.',
            'contains fibers which are hard to the enzymes' => 'يحتوي على ألياف صعبة على الإنزيمات.',
            'contains lot of unhealthy bacteria for the body' => 'يحتوي على الكثير من البكتيريا غير الصحية للجسم.',
            'Fresh juice is not as healthy because the juicing process extracts large amounts of natural sugar while stripping away essential fiber.' => 'العصير الطازج ليس صحيًا بنفس القدر لأن العصر يستخرج كميات كبيرة من السكر الطبيعي ويزيل الألياف الأساسية.',
            'Hard for stomach digestion.(Not for people enzymes).' => 'صعب الهضم على المعدة وغير مناسب لإنزيمات الإنسان.',
            'hard for the enzymes since they are not using whole grain wheat' => 'صعب على الإنزيمات لأنه لا يستخدم قمح الحبوب الكاملة.',
            'hens are vaccinated' => 'الدجاج مُلقّح.',
            'hens are vaccinated and eggs are unhealthy according to tayibat research' => 'الدجاج مُلقّح والبيض غير صحي حسب أبحاث طيبات.',
            'High problems in stomach' => 'قد يسبب مشاكل كبيرة في المعدة.',
            'Most dairy products have been processed in ways that reduce their natural nutritional benefits. (You may consume homemade dairy products prepared from fresh milk obtained from unvaccinated cows.).' => 'معظم منتجات الألبان تمت معالجتها بطرق تقلل فوائدها الغذائية الطبيعية. يمكن تناول منتجات ألبان منزلية من حليب طازج لأبقار غير ملقحة.',
            'Some types of pasta are made with eggs and may also contain additives, preservatives, or highly processed ingredients that can be difficult for some people to digest or may cause stomach discomfort.' => 'بعض أنواع المعكرونة تُصنع بالبيض وقد تحتوي على إضافات أو مواد حافظة أو مكونات معالجة يصعب هضمها وقد تسبب انزعاجًا في المعدة.',
            'Stomach bloating' => 'انتفاخ في المعدة.',
            'unhealthy based on tayibat research' => 'غير صحي حسب أبحاث طيبات.',
            'Very harmful for stomach.' => 'ضار جدًا للمعدة.',
        ];

        foreach ($translations as $reason => $reasonAr) {
            DB::table('dietary_rules')->where('reason', $reason)->update(['reason_ar' => $reasonAr]);
            DB::table('global_rules')->where('reason', $reason)->update(['reason_ar' => $reasonAr]);
        }
    }

    public function down(): void
    {
        DB::table('dietary_rules')->update(['reason_ar' => null]);
        DB::table('global_rules')->update(['reason_ar' => null]);
    }
};
